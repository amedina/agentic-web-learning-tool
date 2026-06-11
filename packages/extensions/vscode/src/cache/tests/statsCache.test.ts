/**
 * External dependencies.
 */
import { describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { StatsCache } from "../statsCache";

/**
 * Builds an in-memory vscode.Memento that satisfies StatsCache's
 * storage contract. Tests can inspect/seed the underlying Map by going
 * through get/update/keys.
 */
function createMemento(): vscode.Memento {
  const store = new Map<string, unknown>();
  return {
    get: <T>(key: string, defaultValue?: T) =>
      (store.has(key) ? (store.get(key) as T) : defaultValue) as T,
    update: async (key: string, value: unknown) => {
      if (value === undefined) {
        store.delete(key);
      } else {
        store.set(key, value);
      }
    },
    keys: () => Array.from(store.keys()),
  };
}

/**
 * Returns a minimal PackageStats stub with just enough fields for
 * tests that don't care about the rest of the payload.
 */
function makeStats(name: string, score = 80): PackageStats {
  return { packageName: name, score } as unknown as PackageStats;
}

/**
 * Returns a deterministic clock whose `now()` is initialised to
 * `initial` and can be advanced by `advance(deltaMs)`. Used to test
 * TTL behavior without relying on real wall-clock time.
 */
function createClock(initial: number) {
  let now = initial;
  return {
    now: () => now,
    advance: (deltaMs: number) => {
      now += deltaMs;
    },
  };
}

describe("StatsCache", () => {
  it("fetches and stores on a miss", async () => {
    const fetcher = vi.fn().mockResolvedValue(makeStats("lodash"));
    const cache = new StatsCache({ storage: createMemento(), fetcher });
    const result = await cache.get("lodash", "^4.17.21");
    expect(result?.packageName).toBe("lodash");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns the cached value without re-fetching when fresh", async () => {
    const fetcher = vi.fn().mockResolvedValue(makeStats("lodash"));
    const cache = new StatsCache({ storage: createMemento(), fetcher });
    await cache.get("lodash", "^4.17.21");
    await cache.get("lodash", "^4.17.21");
    await cache.get("lodash", "^4.17.21");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns the stale value immediately and refreshes in the background", async () => {
    const clock = createClock(1_000);
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(makeStats("lodash", 50))
      .mockResolvedValueOnce(makeStats("lodash", 90));
    const cache = new StatsCache({
      storage: createMemento(),
      fetcher,
      options: { ttlMs: 1_000, clock: clock.now },
    });
    const changes: { name: string; version: string }[] = [];
    cache.onDidChange((change) => changes.push(change));

    const first = await cache.get("lodash", "^4");
    expect(first?.score).toBe(50);

    clock.advance(2_000);

    const second = await cache.get("lodash", "^4");
    expect(second?.score).toBe(50); // stale value returned immediately
    expect(fetcher).toHaveBeenCalledTimes(2);

    // Let the background refresh settle.
    await vi.waitFor(() => expect(changes).toHaveLength(2));

    const third = await cache.get("lodash", "^4");
    expect(third?.score).toBe(90);
  });

  it("treats a null fetcher result as a negative cache entry", async () => {
    const clock = createClock(1_000);
    const fetcher = vi.fn().mockResolvedValue(null);
    const cache = new StatsCache({
      storage: createMemento(),
      fetcher,
      options: { failureTtlMs: 5_000, clock: clock.now },
    });

    expect(await cache.get("missing", "*")).toBeNull();
    expect(await cache.get("missing", "*")).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);

    clock.advance(6_000);

    expect(await cache.get("missing", "*")).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("treats a thrown fetcher as a negative cache entry", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("network down"));
    const cache = new StatsCache({ storage: createMemento(), fetcher });
    expect(await cache.get("flaky", "1")).toBeNull();
    expect(await cache.get("flaky", "1")).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent calls for the same key", async () => {
    let resolveFetch!: (value: PackageStats | null) => void;
    const fetcher = vi.fn().mockReturnValue(
      new Promise<PackageStats | null>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const cache = new StatsCache({ storage: createMemento(), fetcher });

    const promises = [
      cache.get("lodash", "^4"),
      cache.get("lodash", "^4"),
      cache.get("lodash", "^4"),
    ];

    expect(fetcher).toHaveBeenCalledTimes(1);
    resolveFetch(makeStats("lodash"));
    const results = await Promise.all(promises);
    for (const result of results) {
      expect(result?.packageName).toBe("lodash");
    }
  });

  it("treats different version specs as separate cache keys", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(makeStats("lodash", 50))
      .mockResolvedValueOnce(makeStats("lodash", 90));
    const cache = new StatsCache({ storage: createMemento(), fetcher });
    const a = await cache.get("lodash", "^4.17.0");
    const b = await cache.get("lodash", "^4.18.0");
    expect(a?.score).toBe(50);
    expect(b?.score).toBe(90);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("emits onDidChange after a refresh", async () => {
    const fetcher = vi.fn().mockResolvedValue(makeStats("lodash"));
    const cache = new StatsCache({ storage: createMemento(), fetcher });
    const changes: { name: string; version: string }[] = [];
    cache.onDidChange((change) => changes.push(change));
    await cache.get("lodash", "^4");
    expect(changes).toEqual([{ name: "lodash", version: "^4" }]);
  });

  it("clearAll removes only this cache's entries and fires a sentinel change", async () => {
    const memento = createMemento();
    const fetcher = vi.fn().mockResolvedValue(makeStats("lodash"));
    const cache = new StatsCache({ storage: memento, fetcher });
    await cache.get("lodash", "^4");
    await cache.get("react", "^19");

    // Plant an unrelated key that must survive.
    await memento.update("unrelated.preference", "preserved");

    const changes: { name: string; version: string }[] = [];
    cache.onDidChange((change) => changes.push(change));

    const removed = await cache.clearAll();
    expect(removed).toBe(2);
    expect(memento.get("unrelated.preference")).toBe("preserved");
    expect(changes).toEqual([{ name: "*", version: "*" }]);
  });

  it("clearAll on an empty cache returns 0 and fires the sentinel change", async () => {
    const cache = new StatsCache({
      storage: createMemento(),
      fetcher: vi.fn(),
    });
    const changes: { name: string; version: string }[] = [];
    cache.onDidChange((change) => changes.push(change));
    expect(await cache.clearAll()).toBe(0);
    expect(changes).toEqual([{ name: "*", version: "*" }]);
  });

  it("peek returns cached stats synchronously without triggering a fetch", async () => {
    const fetcher = vi.fn().mockResolvedValue(makeStats("lodash"));
    const cache = new StatsCache({ storage: createMemento(), fetcher });
    await cache.get("lodash", "latest");
    expect(fetcher).toHaveBeenCalledTimes(1);
    const peeked = cache.peek("lodash", "latest");
    expect(peeked).toEqual(makeStats("lodash"));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("peek returns null for a negatively cached entry", async () => {
    const fetcher = vi.fn().mockResolvedValue(null);
    const cache = new StatsCache({ storage: createMemento(), fetcher });
    await cache.get("missing", "latest");
    expect(cache.peek("missing", "latest")).toBeNull();
  });

  it("peek returns undefined for an entry that was never cached", () => {
    const cache = new StatsCache({
      storage: createMemento(),
      fetcher: vi.fn(),
    });
    expect(cache.peek("ghost", "latest")).toBeUndefined();
  });

  it("does not fire a background refresh when ttlMs makes every entry fresh forever", async () => {
    const fetcher = vi.fn().mockResolvedValue(makeStats("lodash"));
    const clock = createClock(1_000);
    const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
    const cache = new StatsCache({
      storage: createMemento(),
      fetcher,
      options: { ttlMs: ONE_YEAR, failureTtlMs: ONE_YEAR, clock: clock.now },
    });
    await cache.get("lodash", "latest");
    expect(fetcher).toHaveBeenCalledTimes(1);
    // Advance well past the previous default 24h TTL.
    clock.advance(7 * 24 * 60 * 60 * 1000);
    await cache.get("lodash", "latest");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
