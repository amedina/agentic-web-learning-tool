/**
 * External dependencies.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

/**
 * Internal dependencies.
 */
import { isAuthorized } from "./bearerAuth";
import {
  createSession,
  touchSession,
  type McpServerFactory,
  type Session,
} from "./sessionRegistry";

/**
 * Endpoint path the MCP Streamable HTTP transport listens on. Fixed
 * here because the spec / clients expect a single well-known path.
 */
export const MCP_ENDPOINT = "/mcp";

/**
 * Narrow shape the router needs to do its job: the session map plus
 * the two {@link HttpServerOptions} fields actually consulted per
 * request. Keeps the router unaware of port/host concerns.
 */
export type RouterContext = {
  sessions: Map<string, Session>;
  createMcpServer: McpServerFactory;
  authToken?: string;
};

/**
 * Routes a single Node HTTP request: validates the path / auth, parses
 * the body for POSTs, looks up or creates the matching transport, and
 * delegates to the SDK.
 */
export async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  context: RouterContext,
): Promise<void> {
  if (
    request.url !== MCP_ENDPOINT &&
    !request.url?.startsWith(`${MCP_ENDPOINT}?`)
  ) {
    sendJson(response, 404, {
      error: `Not found. MCP endpoint is ${MCP_ENDPOINT}.`,
    });
    return;
  }

  if (!isAuthorized(request, context.authToken)) {
    response.setHeader("www-authenticate", 'Bearer realm="npm-advisor-mcp"');
    sendJson(response, 401, { error: "Unauthorized" });
    return;
  }

  const sessionIdHeader = request.headers["mcp-session-id"];
  const sessionId = Array.isArray(sessionIdHeader)
    ? sessionIdHeader[0]
    : sessionIdHeader;

  // POST = every client-initiated JSON-RPC request: the initialize
  // handshake AND every later tools/list, tools/call, resources/read,
  // etc. A typical client makes many POSTs over the lifetime of one
  // session — see the lifecycle comment in httpTransport.ts.
  if (request.method === "POST") {
    await handlePost(
      request,
      response,
      context.sessions,
      sessionId,
      context.createMcpServer,
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
    const session = sessionId ? context.sessions.get(sessionId) : undefined;
    if (!session) {
      sendJson(response, 400, { error: "Missing or unknown mcp-session-id" });
      return;
    }
    touchSession(session);
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
      sendJson(response, 404, { error: "Unknown mcp-session-id" });
      return;
    }
    touchSession(existing);
    await existing.transport.handleRequest(request, response, body);
    return;
  }

  if (!isInitializeRequest(body)) {
    sendJson(response, 400, {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message:
          "Bad Request: no mcp-session-id header and body is not an initialize request",
      },
      id: null,
    });
    return;
  }

  const session = await createSession(sessions, createMcpServer);
  await session.transport.handleRequest(request, response, body);
}

/**
 * Sends a JSON response with the given status code. Centralizes the
 * statusCode + content-type + JSON.stringify + end dance shared by
 * every error reply, including the top-level 500 fallback in
 * httpTransport.ts.
 */
export function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
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
 * Stringifies an arbitrary thrown value into a human-readable line.
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
}
