/**
 * External dependencies.
 */
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

/**
 * Endpoint path the MCP Streamable HTTP transport listens on. Fixed
 * here because the spec / clients expect a single well-known path.
 */
const MCP_ENDPOINT = "/mcp";

/**
 * MCP Streamable HTTP — request lifecycle for ONE client.
 *
 * HTTP itself is request/response (one trip = one request + one
 * response, then done), but MCP is a stateful conversation. So a
 * single MCP "session" spans many HTTP round-trips that all share a
 * UUID carried in the `mcp-session-id` header.
 *
 *   1. POST /mcp   initialize          → 200 + Mcp-Session-Id: <uuid>
 *                                        (handshake; server allocates a
 *                                         Session entry in the map)
 *
 *   2. POST /mcp   tools/list          ┐
 *      POST /mcp   tools/call X        │ usually MANY of these during
 *      POST /mcp   tools/call Y        │ one MCP session — a typical
 *      POST /mcp   resources/read …    │ Claude conversation makes
 *                                      ┘ dozens. All carry the UUID.
 *
 *   3. GET  /mcp   (with the UUID)     → optional. Opens an SSE stream
 *                                        the server uses to PUSH
 *                                        notifications (tool progress,
 *                                        "tools list changed", log
 *                                        messages). Many clients open
 *                                        one after step 1 and leave it
 *                                        idle; clients that only do
 *                                        request/response skip it.
 *
 *   4. DELETE /mcp (with the UUID)     → graceful shutdown. Server
 *                                        tears down the Session entry.
 *                                        If the client just hard-
 *                                        disconnects we clean up via
 *                                        transport.onclose instead.
 */

/**
 * Factory that mints a fresh {@link McpServer} for a new HTTP session.
 * Injected by the caller so this module stays decoupled from the
 * concrete server wiring in `server.ts`.
 */
export type McpServerFactory = () => Promise<McpServer>;

/**
 * Options accepted by {@link startHttpServer}.
 */
export type HttpServerOptions = {
  /** TCP port to listen on. */
  port: number;
  /** Hostname / address to bind. Use 127.0.0.1 for loopback-only, 0.0.0.0 to expose on all interfaces. */
  host: string;
  /** Builds the MCP server bound to each new session. */
  createMcpServer: McpServerFactory;
  /** Optional bearer token. If set, every request must include `Authorization: Bearer <token>`. */
  authToken?: string;
};

/**
 * Result returned by {@link startHttpServer}, exposing the live HTTP
 * server (so tests can read the actual bound port + close it) and a
 * shutdown helper that cleans up every active MCP session.
 */
export type RunningHttpServer = {
  httpServer: HttpServer;
  port: number;
  close: () => Promise<void>;
};

/**
 * One MCP client's live protocol state. The server keeps a `Session`
 * entry in the `sessions` map for every connected client until the
 * client disconnects, sends DELETE, or the server itself shuts down.
 *
 * "Session" here is NOT a web-cookie/login session — it's MCP
 * protocol state: capabilities negotiated at initialize, in-flight
 * request IDs, push-notification subscriptions, etc.
 *
 * Example: three Claude Desktop windows pointed at this same server
 * = three Session entries in the map, each with its own UUID, its
 * own StreamableHTTPServerTransport, and its own McpServer instance
 * (one per session is the spec-recommended pattern; the SDK isn't
 * designed to multiplex multiple clients onto a single McpServer).
 *
 * `closing` is a re-entry guard: closing the transport fires
 * onclose, which deletes the session, but McpServer.close() also
 * closes the transport — without the flag we'd recurse and double-
 * delete.
 */
type Session = {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  closing: boolean;
};

/**
 * Boots an HTTP server that speaks the MCP Streamable HTTP transport.
 *
 * One MCP session = one {@link StreamableHTTPServerTransport} +
 * {@link McpServer} pair. A POST whose body is an `initialize` request
 * mints a new session; subsequent requests carry the `mcp-session-id`
 * header and route to the existing transport.
 */
export async function startHttpServer(
  options: HttpServerOptions,
): Promise<RunningHttpServer> {
  const sessions = new Map<string, Session>();

  const httpServer = createHttpServer((request, response) => {
    void handleRequest(request, response, sessions, options).catch((error) => {
      process.stderr.write(
        `npm-advisor-mcp http error: ${formatError(error)}\n`,
      );
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader("content-type", "application/json");
        response.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          }),
        );
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error): void => {
      reject(error);
    };
    httpServer.once("error", onError);
    httpServer.listen(options.port, options.host, () => {
      httpServer.off("error", onError);
      resolve();
    });
  });

  const address = httpServer.address();
  const boundPort =
    typeof address === "object" && address !== null
      ? address.port
      : options.port;

  process.stderr.write(
    `npm-advisor-mcp listening on http://${options.host}:${boundPort}${MCP_ENDPOINT}\n`,
  );
  if (
    !options.authToken &&
    options.host !== "127.0.0.1" &&
    options.host !== "localhost"
  ) {
    process.stderr.write(
      "npm-advisor-mcp warning: bound to a non-loopback address with no auth token. Set MCP_HTTP_TOKEN to require Authorization: Bearer <token>.\n",
    );
  }

  return {
    httpServer,
    port: boundPort,
    close: async () => {
      for (const session of sessions.values()) {
        if (session.closing) {
          continue;
        }
        session.closing = true;
        try {
          await session.server.close();
        } catch {
          // Ignore — we're shutting down anyway.
        }
      }
      sessions.clear();
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

/**
 * Routes a single Node HTTP request: validates the path / auth, parses
 * the body for POSTs, looks up or creates the matching transport, and
 * delegates to the SDK.
 */
async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  sessions: Map<string, Session>,
  options: HttpServerOptions,
): Promise<void> {
  if (
    request.url !== MCP_ENDPOINT &&
    !request.url?.startsWith(`${MCP_ENDPOINT}?`)
  ) {
    response.statusCode = 404;
    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({
        error: `Not found. MCP endpoint is ${MCP_ENDPOINT}.`,
      }),
    );
    return;
  }

  if (!isAuthorized(request, options.authToken)) {
    response.statusCode = 401;
    response.setHeader("content-type", "application/json");
    response.setHeader("www-authenticate", 'Bearer realm="npm-advisor-mcp"');
    response.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const sessionIdHeader = request.headers["mcp-session-id"];
  const sessionId = Array.isArray(sessionIdHeader)
    ? sessionIdHeader[0]
    : sessionIdHeader;

  // POST = every client-initiated JSON-RPC request: the initialize
  // handshake AND every later tools/list, tools/call, resources/read,
  // etc. A typical client makes many POSTs over the lifetime of one
  // session — see the lifecycle comment above MCP_ENDPOINT.
  if (request.method === "POST") {
    await handlePost(
      request,
      response,
      sessions,
      sessionId,
      options.createMcpServer,
    );
    return;
  }

  // GET = open an SSE stream so the server can PUSH notifications
  // (tool-call progress, list-changed, log messages) without the
  // client polling. Optional — clients that only do request/response
  // never call GET.
  //
  // DELETE = client politely tearing down the session. We delegate
  // to the SDK transport, which fires onclose and removes the entry
  // from the sessions map.
  //
  // Both require a session id because both target an existing
  // session — neither can mint a new one.
  if (request.method === "GET" || request.method === "DELETE") {
    const session = sessionId ? sessions.get(sessionId) : undefined;
    if (!session) {
      response.statusCode = 400;
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({ error: "Missing or unknown mcp-session-id" }),
      );
      return;
    }
    await session.transport.handleRequest(request, response);
    return;
  }

  response.statusCode = 405;
  response.setHeader("allow", "GET, POST, DELETE");
  response.end();
}

/**
 * Handles a POST: reads the JSON body, then either spins up a new
 * session (if the body is an `initialize` request) or routes to an
 * existing session looked up by header.
 */
async function handlePost(
  request: IncomingMessage,
  response: ServerResponse,
  sessions: Map<string, Session>,
  sessionId: string | undefined,
  createMcpServer: McpServerFactory,
): Promise<void> {
  const body = await readJsonBody(request);

  if (sessionId) {
    const existing = sessions.get(sessionId);
    if (!existing) {
      response.statusCode = 404;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: "Unknown mcp-session-id" }));
      return;
    }
    await existing.transport.handleRequest(request, response, body);
    return;
  }

  if (!isInitializeRequest(body)) {
    response.statusCode = 400;
    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message:
            "Bad Request: no mcp-session-id header and body is not an initialize request",
        },
        id: null,
      }),
    );
    return;
  }

  const session = await createSession(sessions, createMcpServer);
  await session.transport.handleRequest(request, response, body);
}

/**
 * Mints a fresh MCP server + transport pair for a new client session
 * and registers it in the session map once the SDK assigns its
 * session id. Wires onclose with a re-entry guard so that closing the
 * transport, the McpServer, or removing the session entry only fires
 * the cleanup chain once.
 */
async function createSession(
  sessions: Map<string, Session>,
  createMcpServer: McpServerFactory,
): Promise<Session> {
  let session: Session | undefined;

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      if (session) {
        sessions.set(id, session);
      }
    },
    onsessionclosed: (id) => {
      sessions.delete(id);
    },
  });

  const server = await createMcpServer();
  await server.connect(transport);

  session = { transport, server, closing: false };

  transport.onclose = () => {
    if (session!.closing) {
      return;
    }
    session!.closing = true;
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };

  return session;
}

/**
 * Reads the full request body and parses it as JSON. Returns
 * `undefined` for empty bodies. Sets utf8 encoding so the stream
 * yields strings, skipping the Buffer concat dance.
 */
async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  request.setEncoding("utf8");
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
  }
  if (raw.length === 0) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON body: ${formatError(error)}`);
  }
}

/**
 * Returns true when the request is allowed through.
 *
 * Auth is a SHARED-SECRET bearer token check, not identity auth —
 * there's no users table, no database lookup, no public-key crypto.
 * The user sets `MCP_HTTP_TOKEN=<long-random-string>` in the
 * server's environment and pastes the same string into the client's
 * config as `Authorization: Bearer <long-random-string>`. We just
 * compare the two strings: if they match, the request must have
 * known the secret. Same model as GitHub PATs, Anthropic API keys,
 * Stripe API keys, etc.
 *
 * The compare uses `timingSafeEqualString` so a network-side
 * attacker can't time their way to discovering the token one
 * character at a time. The wire itself should be TLS in any
 * deployment that exposes the server beyond loopback, otherwise a
 * sniffer would just read the token off the request.
 *
 * If no token is configured every request passes — auth is opt-in
 * for hosted/remote deployments. The default 127.0.0.1 bind keeps
 * unauthenticated mode safe by making the port unreachable from
 * outside the machine.
 */
function isAuthorized(request: IncomingMessage, expected?: string): boolean {
  if (!expected) {
    return true;
  }
  const header = request.headers.authorization;
  if (typeof header !== "string") {
    return false;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) {
    return false;
  }
  return timingSafeEqualString(match[1], expected);
}

/**
 * Length-aware constant-time string comparison. Avoids leaking the
 * configured token's length through early-return timing differences.
 */
function timingSafeEqualString(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

/**
 * Stringifies an arbitrary thrown value into a human-readable line.
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
}
