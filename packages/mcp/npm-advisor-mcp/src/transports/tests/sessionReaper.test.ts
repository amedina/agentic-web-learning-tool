/**
 * External dependencies.
 */
import { describe, expect, it, vi } from "vitest";

/**
 * Internal dependencies.
 */
import {
  createSessionReaper,
  touchSession,
  type Session,
} from "../sessionRegistry";

/**
 * Build a Session stub that exposes only the fields the reaper reads.
 * `server.close()` is a mock so tests can assert teardown invocation.
 */
function makeSession(lastActivity: number): Session {
  return {
    closing: false,
    lastActivity,
    transport: {} as unknown as Session["transport"],
    server: {
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as Session["server"],
  };
}

/** Manual interval harness so tests don't depend on real timers. */
function makeIntervalScheduler() {
  let nextId = 1;
  const handlers = new Map<number, () => void>();
  return {
    schedule: {
      setInterval: (handler: () => void, _ms: number) => {
        const id = nextId++;
        handlers.set(id, handler);
        return id;
      },
      clearInterval: (handle: unknown) => {
        if (typeof handle === "number") {
          handlers.delete(handle);
        }
      },
    },
    fire: (id: number) => handlers.get(id)?.(),
    fireAll: () => {
      for (const handler of handlers.values()) {
        handler();
      }
    },
    pendingCount: () => handlers.size,
  };
}

describe("createSessionReaper - reap policy", () => {
  it("evicts sessions whose lastActivity falls behind the idle window", () => {
    const sessions = new Map<string, Session>();
    // cutoff = now() - idleTtlMs = 10_000 - 1_000 = 9_000. lastActivity
    // greater than the cutoff survives; less than or equal is reaped.
    const idle = makeSession(0);
    const fresh = makeSession(9_500);
    sessions.set("idle", idle);
    sessions.set("fresh", fresh);

    const reaper = createSessionReaper(sessions, {
      idleTtlMs: 1_000,
      reapIntervalMs: 60_000,
      now: () => 10_000,
    });

    reaper.reap();

    expect(sessions.has("idle")).toBe(false);
    expect(sessions.has("fresh")).toBe(true);
    expect(idle.closing).toBe(true);
    expect(idle.server.close).toHaveBeenCalledOnce();
    expect(fresh.server.close).not.toHaveBeenCalled();
  });

  it("does not reap a session whose lastActivity is inside the window", () => {
    const sessions = new Map<string, Session>();
    const session = makeSession(9_999);
    sessions.set("a", session);
    const reaper = createSessionReaper(sessions, {
      idleTtlMs: 1_000,
      reapIntervalMs: 60_000,
      now: () => 10_000,
    });
    reaper.reap();
    expect(sessions.has("a")).toBe(true);
  });

  it("skips sessions that are already marked closing", () => {
    const sessions = new Map<string, Session>();
    const session = makeSession(0);
    session.closing = true;
    sessions.set("a", session);
    const reaper = createSessionReaper(sessions, {
      idleTtlMs: 1_000,
      reapIntervalMs: 60_000,
      now: () => 10_000,
    });
    reaper.reap();
    expect(session.server.close).not.toHaveBeenCalled();
  });
});

describe("createSessionReaper - lifecycle", () => {
  it("start() schedules the periodic reap", () => {
    const sessions = new Map<string, Session>();
    const scheduler = makeIntervalScheduler();
    const reaper = createSessionReaper(sessions, {
      idleTtlMs: 1_000,
      reapIntervalMs: 60_000,
      setInterval: scheduler.schedule.setInterval,
      clearInterval: scheduler.schedule.clearInterval,
    });
    reaper.start();
    expect(scheduler.pendingCount()).toBe(1);
  });

  it("start() is idempotent — calling twice doesn't schedule twice", () => {
    const sessions = new Map<string, Session>();
    const scheduler = makeIntervalScheduler();
    const reaper = createSessionReaper(sessions, {
      idleTtlMs: 1_000,
      reapIntervalMs: 60_000,
      setInterval: scheduler.schedule.setInterval,
      clearInterval: scheduler.schedule.clearInterval,
    });
    reaper.start();
    reaper.start();
    expect(scheduler.pendingCount()).toBe(1);
  });

  it("stop() clears the timer", () => {
    const sessions = new Map<string, Session>();
    const scheduler = makeIntervalScheduler();
    const reaper = createSessionReaper(sessions, {
      idleTtlMs: 1_000,
      reapIntervalMs: 60_000,
      setInterval: scheduler.schedule.setInterval,
      clearInterval: scheduler.schedule.clearInterval,
    });
    reaper.start();
    reaper.stop();
    expect(scheduler.pendingCount()).toBe(0);
  });

  it("the scheduled callback runs a real reap pass", () => {
    const sessions = new Map<string, Session>();
    const idle = makeSession(0);
    sessions.set("idle", idle);
    const scheduler = makeIntervalScheduler();
    const reaper = createSessionReaper(sessions, {
      idleTtlMs: 1_000,
      reapIntervalMs: 60_000,
      now: () => 10_000,
      setInterval: scheduler.schedule.setInterval,
      clearInterval: scheduler.schedule.clearInterval,
    });
    reaper.start();
    scheduler.fireAll();
    expect(sessions.has("idle")).toBe(false);
  });
});

describe("touchSession", () => {
  it("updates lastActivity to the supplied clock value", () => {
    const session = makeSession(0);
    touchSession(session, () => 12_345);
    expect(session.lastActivity).toBe(12_345);
  });
});
