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
  /**
   * Epoch milliseconds of the most recent request touching this session
   * (initialize, every POST, every GET / DELETE). The TTL reaper in
   * {@link createSessionReaper} evicts sessions whose `lastActivity`
   * has fallen behind the configured idle window so abandoned clients
   * can't accumulate transports + open SSE streams indefinitely.
   */
  lastActivity: number;
};

/**
 * Update the activity timestamp on a session. Called by the HTTP
 * router on every request that resolves to a known session, including
 * the initial handshake. Centralised here so future stats (per-method
 * counters, request-rate guards) can hang off the same hook.
 */
export function touchSession(
  session: Session,
  now: () => number = Date.now,
): void {
  session.lastActivity = now();
}

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
  now: () => number = Date.now,
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

  session = { transport, server, closing: false, lastActivity: now() };

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

/**
 * Configuration knobs for {@link createSessionReaper}. Defaults match
 * the values exposed by the HTTP transport — long-running remote
 * instances can tune them via env vars without touching code.
 */
export interface SessionReaperOptions {
  /** Idle window after which a session is evicted. Default 30 minutes. */
  idleTtlMs: number;
  /** How often the reaper wakes up to scan the session map. Default 60 seconds. */
  reapIntervalMs: number;
  /** Wall-clock override; tests pin this. */
  now?: () => number;
  /** Timer overrides; tests pin these. */
  setInterval?: (handler: () => void, ms: number) => unknown;
  clearInterval?: (handle: unknown) => void;
}

/**
 * Public surface for a running reaper. Built by {@link createSessionReaper}.
 */
export interface SessionReaper {
  /** Begin scanning the session map on the configured interval. */
  start(): void;
  /** Stop scanning and drop the timer; safe to call more than once. */
  stop(): void;
  /**
   * Run one reap pass immediately. Used by the periodic timer and
   * exposed so tests can drive a deterministic sweep without depending
   * on the timer infrastructure.
   */
  reap(): void;
}

/**
 * Build a TTL-based session reaper. The HTTP transport spawns one of
 * these alongside its `Map<string, Session>`; without the reaper, a
 * client that initialises a session and then disappears (process
 * crash, sleep, NAT timeout — anything short of a clean DELETE) leaks
 * the session entry, the transport, the McpServer instance, and any
 * open SSE stream attached to it indefinitely.
 *
 * Reap policy: when `lastActivity` falls behind `idleTtlMs`, the
 * session is marked closing and its underlying `McpServer.close()`
 * is invoked, which closes the transport and any SSE stream the
 * client opened. The session is then removed from the map.
 */
export function createSessionReaper(
  sessions: Map<string, Session>,
  options: SessionReaperOptions,
): SessionReaper {
  const now = options.now ?? Date.now;
  const setIntervalFn =
    options.setInterval ??
    ((handler, ms) =>
      setInterval(handler, ms) as unknown as ReturnType<typeof setInterval>);
  const clearIntervalFn =
    options.clearInterval ??
    ((handle) => clearInterval(handle as Parameters<typeof clearInterval>[0]));
  let handle: unknown = null;

  const reap = (): void => {
    const cutoff = now() - options.idleTtlMs;
    for (const [id, session] of sessions) {
      if (session.closing) {
        continue;
      }
      if (session.lastActivity > cutoff) {
        continue;
      }
      session.closing = true;
      sessions.delete(id);
      // Fire-and-forget: closing the McpServer cascades into the
      // transport and any SSE stream. We don't await because the reap
      // pass should be synchronous and bounded; close() errors are
      // logged to stderr but not raised — we're already evicting a
      // dead session.
      session.server.close().catch((error: unknown) => {
        process.stderr.write(
          `npm-advisor-mcp: reaping idle session ${id} failed: ${
            error instanceof Error ? error.message : String(error)
          }\n`,
        );
      });
    }
  };

  return {
    start() {
      if (handle !== null) {
        return;
      }
      handle = setIntervalFn(reap, options.reapIntervalMs);
      // Node's setInterval handles have a .unref() that lets the
      // process exit even with the timer pending. Without it, a
      // remote-hosted server that has zero active sessions still
      // blocks shutdown until the next interval fires.
      const maybeRef = handle as { unref?: () => void };
      if (typeof maybeRef.unref === "function") {
        maybeRef.unref();
      }
    },
    stop() {
      if (handle === null) {
        return;
      }
      clearIntervalFn(handle);
      handle = null;
    },
    reap,
  };
}
