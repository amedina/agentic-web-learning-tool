/**
 * External dependencies.
 */
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

/**
 * Factory that mints a fresh {@link McpServer} for a new HTTP session.
 * Injected by the caller so this module stays decoupled from the
 * concrete server wiring in `server.ts`.
 */
export type McpServerFactory = () => Promise<McpServer>;

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
export type Session = {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  closing: boolean;
};

/**
 * Mints a fresh MCP server + transport pair for a new client session
 * and registers it in the session map once the SDK assigns its
 * session id. Wires onclose with a re-entry guard so that closing the
 * transport, the McpServer, or removing the session entry only fires
 * the cleanup chain once.
 */
export async function createSession(
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
 * Tears down every live session, marking each as closing first to
 * suppress the onclose recursion, then clears the map. Errors from
 * individual server.close() calls are swallowed because the caller
 * is already on the shutdown path.
 */
export async function closeAllSessions(
  sessions: Map<string, Session>,
): Promise<void> {
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
}
