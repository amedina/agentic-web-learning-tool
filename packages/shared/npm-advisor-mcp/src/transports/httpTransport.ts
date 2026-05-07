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
 * Internal dependencies.
 */
import { createServer as createMcpServer } from "../server";

/**
 * Endpoint path the MCP Streamable HTTP transport listens on. Fixed
 * here because the spec / clients expect a single well-known path.
 */
const MCP_ENDPOINT = "/mcp";

/**
 * Options accepted by {@link startHttpServer}.
 */
export type HttpServerOptions = {
  /** TCP port to listen on. */
  port: number;
  /** Hostname / address to bind. Use 127.0.0.1 for loopback-only, 0.0.0.0 to expose on all interfaces. */
  host: string;
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
 * Bookkeeping for one active MCP client session — the transport, the
 * MCP server bound to it, and a re-entry guard that prevents the
 * transport.close → onclose → server.close → transport.close cycle.
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

  if (request.method === "POST") {
    await handlePost(request, response, sessions, sessionId);
    return;
  }

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

  const session = await createSession(sessions);
  await session.transport.handleRequest(request, response, body);
}

/**
 * Mints a fresh MCP server + transport pair for a new client session
 * and registers it in the session map once the SDK assigns its
 * session id. Wires onclose with a re-entry guard so that closing the
 * transport, the McpServer, or removing the session entry only fires
 * the cleanup chain once.
 */
async function createSession(sessions: Map<string, Session>): Promise<Session> {
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
 * `undefined` for empty bodies.
 */
async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) {
    return undefined;
  }
  const raw = Buffer.concat(chunks).toString("utf8");
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
 * Returns true when the request is allowed through. If no token is
 * configured every request passes; otherwise the caller must present
 * `Authorization: Bearer <token>` with a constant-time match.
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
