/**
 * External dependencies.
 */
import {
  createServer as createHttpServer,
  type Server as HttpServer,
} from "node:http";

/**
 * Internal dependencies.
 */
import {
  formatError,
  handleRequest,
  MCP_ENDPOINT,
  sendJson,
} from "./requestRouter";
import {
  closeAllSessions,
  createSessionReaper,
  type McpServerFactory,
  type Session,
} from "./sessionRegistry";

export type { McpServerFactory } from "./sessionRegistry";

/**
 * Default idle window after which an abandoned session is evicted by
 * the reaper. 30 minutes balances "kill leaked sessions before they
 * matter" against "don't kill a conversation while the user is reading
 * the last reply".
 */
const DEFAULT_IDLE_TTL_MS = 30 * 60 * 1000;

/**
 * Default cadence on which the reaper scans the session map. 60 seconds
 * is short enough that a leak is bounded but long enough that the scan
 * cost is irrelevant.
 */
const DEFAULT_REAP_INTERVAL_MS = 60 * 1000;

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
  /**
   * Idle window after which the session reaper evicts an abandoned
   * session. Defaults to 30 minutes; expose only when a deployment
   * needs to tune it (e.g. CI runs where 30 minutes is forever).
   */
  idleTtlMs?: number;
  /**
   * How often the reaper scans the session map. Defaults to 60 seconds.
   * Mostly useful for tests that want to drive a tighter schedule.
   */
  reapIntervalMs?: number;
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
 * Boots an HTTP server that speaks the MCP Streamable HTTP transport.
 *
 * One MCP session = one StreamableHTTPServerTransport + McpServer
 * pair. A POST whose body is an `initialize` request mints a new
 * session; subsequent requests carry the `mcp-session-id` header and
 * route to the existing transport.
 */
export async function startHttpServer(
  options: HttpServerOptions,
): Promise<RunningHttpServer> {
  const sessions = new Map<string, Session>();
  const reaper = createSessionReaper(sessions, {
    idleTtlMs: options.idleTtlMs ?? DEFAULT_IDLE_TTL_MS,
    reapIntervalMs: options.reapIntervalMs ?? DEFAULT_REAP_INTERVAL_MS,
  });
  reaper.start();

  const httpServer = createHttpServer((request, response) => {
    void handleRequest(request, response, {
      sessions,
      createMcpServer: options.createMcpServer,
      authToken: options.authToken,
    }).catch((error) => {
      process.stderr.write(
        `npm-advisor-mcp http error: ${formatError(error)}\n`,
      );
      if (!response.headersSent) {
        sendJson(response, 500, {
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
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
      reaper.stop();
      await closeAllSessions(sessions);
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
