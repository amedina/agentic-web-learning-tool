/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Internal dependencies.
 */
import { persistentStatsCache } from "../persistentStatsCache";

/**
 * Installs an in-memory `chrome.storage.local` stub and returns the backing
 * store so a test can inspect what was written.
 */
function installChromeMock(): { store: Record<string, unknown> } {
  const store: Record<string, unknown> = {};
  const local = {
    get: vi.fn(async (key: string | string[]) => {
      const keys = Array.isArray(key) ? key : [key];
      const out: Record<string, unknown> = {};
      for (const oneKey of keys) {
        if (oneKey in store) {
          out[oneKey] = store[oneKey];
        }
      }
      return out;
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(store, items);
    }),
    remove: vi.fn(async (keys: string | string[]) => {
      const list = Array.isArray(keys) ? keys : [keys];
      for (const oneKey of list) {
        delete store[oneKey];
      }
    }),
  };
  (globalThis as any).chrome = { storage: { local } };
  return { store };
}

describe("persistentStatsCache", () => {
  beforeEach(() => {
    installChromeMock();
  });

  afterEach(() => {
    delete (globalThis as any).chrome;
    vi.clearAllMocks();
  });

  it("round-trips stats with a saved-at timestamp", async () => {
    await persistentStatsCache.set("react", { packageName: "react" } as any);

    const entry = await persistentStatsCache.get("react");

    expect(entry?.stats).toEqual({ packageName: "react" });
    expect(typeof entry?.savedAt).toBe("number");
  });

  it("returns null for a package that was never saved", async () => {
    expect(await persistentStatsCache.get("never-seen")).toBeNull();
  });

  it("is a safe no-op when chrome.storage is unavailable", async () => {
    delete (globalThis as any).chrome;

    await expect(
      persistentStatsCache.set("react", { packageName: "react" } as any),
    ).resolves.toBeUndefined();
    expect(await persistentStatsCache.get("react")).toBeNull();
  });

  it("evicts the oldest entry once the cap is exceeded", async () => {
    for (let index = 0; index < 301; index += 1) {
      await persistentStatsCache.set(`pkg-${index}`, {
        packageName: `pkg-${index}`,
      } as any);
    }

    // pkg-0 was the first inserted, so it should have been evicted.
    expect(await persistentStatsCache.get("pkg-0")).toBeNull();
    // The most recent entries survive.
    expect((await persistentStatsCache.get("pkg-300"))?.stats).toEqual({
      packageName: "pkg-300",
    });
  });

  it("clears every persisted entry", async () => {
    await persistentStatsCache.set("react", { packageName: "react" } as any);
    await persistentStatsCache.set("vue", { packageName: "vue" } as any);

    await persistentStatsCache.clear();

    expect(await persistentStatsCache.get("react")).toBeNull();
    expect(await persistentStatsCache.get("vue")).toBeNull();
  });
});
