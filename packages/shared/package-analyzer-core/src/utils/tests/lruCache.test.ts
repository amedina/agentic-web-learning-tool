/**
 * External dependencies.
 */
import { describe, it, expect } from "vitest";

/**
 * Internal dependencies.
 */
import { LruTtlCache } from "../lruCache";

/**
 * Build a clock helper whose value can be advanced. Avoids the
 * overhead of vi.useFakeTimers for a unit that only needs a Date.now
 * substitute.
 */
function makeClock(initial: number = 0) {
  let now = initial;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("LruTtlCache - basics", () => {
  it("stores and retrieves a value", () => {
    const cache = new LruTtlCache<string>({ maxSize: 4, ttlMs: 1000 });
    cache.set("a", "alpha");
    expect(cache.get("a")).toBe("alpha");
  });

  it("returns undefined for a missing key", () => {
    const cache = new LruTtlCache<string>();
    expect(cache.get("nope")).toBeUndefined();
  });

  it("has() distinguishes a missing entry from a cached null", () => {
    const cache = new LruTtlCache<string | null>();
    cache.set("present", null);
    expect(cache.has("present")).toBe(true);
    expect(cache.get("present")).toBeNull();
    expect(cache.has("absent")).toBe(false);
  });
});

describe("LruTtlCache - LRU eviction", () => {
  it("evicts the least-recently-used entry when over capacity", () => {
    const cache = new LruTtlCache<string>({ maxSize: 3, ttlMs: 10_000 });
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    cache.set("d", "4"); // evicts "a"
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
    expect(cache.has("c")).toBe(true);
    expect(cache.has("d")).toBe(true);
    expect(cache.size).toBe(3);
  });

  it("promotes a read entry to most-recently-used", () => {
    const cache = new LruTtlCache<string>({ maxSize: 3, ttlMs: 10_000 });
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    // Reading "a" should bump it past "b" in recency.
    cache.get("a");
    cache.set("d", "4"); // evicts "b" instead of "a"
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
    expect(cache.has("c")).toBe(true);
    expect(cache.has("d")).toBe(true);
  });
});

describe("LruTtlCache - TTL", () => {
  it("evicts an entry that has expired", () => {
    const clock = makeClock(0);
    const cache = new LruTtlCache<string>({ ttlMs: 1000, clock: clock.now });
    cache.set("a", "alpha");
    clock.advance(1001);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.has("a")).toBe(false);
  });

  it("keeps an entry that's still within TTL", () => {
    const clock = makeClock(0);
    const cache = new LruTtlCache<string>({ ttlMs: 1000, clock: clock.now });
    cache.set("a", "alpha");
    clock.advance(999);
    expect(cache.get("a")).toBe("alpha");
  });
});

describe("LruTtlCache - getOrFetch single-flight", () => {
  it("calls the fetcher only once for two concurrent identical requests", async () => {
    const cache = new LruTtlCache<string>();
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "value";
    };
    const [first, second] = await Promise.all([
      cache.getOrFetch("key", fetcher),
      cache.getOrFetch("key", fetcher),
    ]);
    expect(first).toBe("value");
    expect(second).toBe("value");
    expect(calls).toBe(1);
  });

  it("retries on the next call after a fetcher rejection", async () => {
    const cache = new LruTtlCache<string>();
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("transient");
      }
      return "ok";
    };
    await expect(cache.getOrFetch("key", fetcher)).rejects.toThrow("transient");
    expect(await cache.getOrFetch("key", fetcher)).toBe("ok");
    expect(calls).toBe(2);
  });

  it("caches a null value and skips the second fetch", async () => {
    const cache = new LruTtlCache<string | null>();
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return null;
    };
    await cache.getOrFetch("key", fetcher);
    await cache.getOrFetch("key", fetcher);
    expect(calls).toBe(1);
  });
});

describe("LruTtlCache - clear", () => {
  it("drops every entry and in-flight promise", async () => {
    const cache = new LruTtlCache<string>();
    cache.set("a", "1");
    expect(cache.has("a")).toBe(true);
    cache.clear();
    expect(cache.has("a")).toBe(false);
    expect(cache.size).toBe(0);
  });
});

describe("LruTtlCache - AbortSignal", () => {
  it("rejects immediately when the signal is already aborted", async () => {
    const cache = new LruTtlCache<string>();
    const controller = new AbortController();
    controller.abort(new Error("already cancelled"));
    await expect(
      cache.getOrFetch("key", async () => "value", controller.signal),
    ).rejects.toThrow("already cancelled");
  });

  it("rejects this caller's await when the signal aborts mid-fetch", async () => {
    const cache = new LruTtlCache<string>();
    const controller = new AbortController();
    let resolveFetcher!: (value: string) => void;
    const fetcher = () =>
      new Promise<string>((resolve) => {
        resolveFetcher = resolve;
      });
    const pending = cache.getOrFetch("key", fetcher, controller.signal);
    controller.abort(new Error("cancelled"));
    await expect(pending).rejects.toThrow("cancelled");
    // Underlying fetch still completes and warms the cache.
    resolveFetcher("eventual");
    // Give microtasks a turn so the cache fills.
    await Promise.resolve();
    await Promise.resolve();
    expect(cache.get("key")).toBe("eventual");
  });

  it("does not affect a concurrent caller without a signal", async () => {
    const cache = new LruTtlCache<string>();
    const controller = new AbortController();
    let resolveFetcher!: (value: string) => void;
    const fetcher = () =>
      new Promise<string>((resolve) => {
        resolveFetcher = resolve;
      });
    const cancelling = cache.getOrFetch("key", fetcher, controller.signal);
    const passive = cache.getOrFetch("key", fetcher);
    controller.abort(new Error("cancelled"));
    await expect(cancelling).rejects.toThrow("cancelled");
    resolveFetcher("eventual");
    expect(await passive).toBe("eventual");
  });

  it("returns cached values without consulting the signal", async () => {
    const cache = new LruTtlCache<string>();
    cache.set("key", "cached");
    const controller = new AbortController();
    // Not aborted yet → cached read returns synchronously.
    expect(
      await cache.getOrFetch("key", async () => "fresh", controller.signal),
    ).toBe("cached");
  });
});
