/**
 * External dependencies.
 */
import { type PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Prefix for every per-package entry written to `chrome.storage.local`. Keeping
 * each package under its own key avoids reading and rewriting one giant blob on
 * every save.
 */
const ENTRY_KEY_PREFIX = "persistentStats:";

/**
 * Key holding the insertion-ordered list of package names currently persisted,
 * used to evict the oldest entries once {@link MAX_ENTRIES} is exceeded.
 */
const INDEX_KEY = "persistentStatsIndex";

/**
 * Upper bound on how many packages we keep on disk. This is a disaster-recovery
 * store, not a primary cache, so a few hundred recently viewed packages is more
 * than enough to cover a registry outage. `unlimitedStorage` is granted, but a
 * bound still prevents unbounded growth over months of use.
 */
const MAX_ENTRIES = 300;

interface PersistentStatsEntry {
  stats: PackageStats;
  savedAt: number;
}

/**
 * Returns true when the extension storage API is reachable. Guards every method
 * so the module is a no-op in non-extension contexts (e.g. unit tests that
 * don't stub `chrome`).
 */
function isStorageAvailable(): boolean {
  return (
    typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.local
  );
}

/**
 * Builds the storage key for a package's persisted entry.
 */
function entryKey(packageName: string): string {
  return `${ENTRY_KEY_PREFIX}${packageName}`;
}

/**
 * Last-resort cache for {@link PackageStats}, persisted to
 * `chrome.storage.local`. Unlike the in-memory caches in `packageStatsService`,
 * this survives service-worker eviction, so when every registry is unreachable
 * the side panel can still show the last good data it saw for a package rather
 * than a hard error.
 */
export const persistentStatsCache = {
  /**
   * Reads the persisted entry for a package, or `null` when nothing is stored
   * (or storage is unavailable).
   */
  async get(packageName: string): Promise<PersistentStatsEntry | null> {
    if (!isStorageAvailable()) {
      return null;
    }
    try {
      const key = entryKey(packageName);
      const result = await chrome.storage.local.get(key);
      return (result[key] as PersistentStatsEntry | undefined) ?? null;
    } catch (error) {
      console.warn(
        `[NPM Advisor] Failed to read persistent stats for ${packageName}:`,
        error,
      );
      return null;
    }
  },

  /**
   * Persists a package's stats, refreshing its position in the eviction index
   * and dropping the oldest entries once the cap is exceeded. Failures are
   * swallowed — this is a best-effort safety net and must never break the live
   * fetch path that calls it.
   */
  async set(packageName: string, stats: PackageStats): Promise<void> {
    if (!isStorageAvailable()) {
      return;
    }
    try {
      const entry: PersistentStatsEntry = { stats, savedAt: Date.now() };
      const indexResult = await chrome.storage.local.get(INDEX_KEY);
      const existingIndex =
        (indexResult[INDEX_KEY] as string[] | undefined) ?? [];

      const nextIndex = existingIndex.filter((name) => name !== packageName);
      nextIndex.push(packageName);

      const keysToRemove: string[] = [];
      while (nextIndex.length > MAX_ENTRIES) {
        const evicted = nextIndex.shift();
        if (evicted) {
          keysToRemove.push(entryKey(evicted));
        }
      }

      await chrome.storage.local.set({
        [entryKey(packageName)]: entry,
        [INDEX_KEY]: nextIndex,
      });
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
    } catch (error) {
      console.warn(
        `[NPM Advisor] Failed to persist stats for ${packageName}:`,
        error,
      );
    }
  },

  /**
   * Removes every persisted entry and the index. Exposed for completeness and
   * tests; the manual-refresh path deliberately does not call this, so the
   * last-resort copy survives a refresh that fails to reach the network.
   */
  async clear(): Promise<void> {
    if (!isStorageAvailable()) {
      return;
    }
    try {
      const indexResult = await chrome.storage.local.get(INDEX_KEY);
      const existingIndex =
        (indexResult[INDEX_KEY] as string[] | undefined) ?? [];
      const keys = existingIndex.map((name) => entryKey(name));
      keys.push(INDEX_KEY);
      await chrome.storage.local.remove(keys);
    } catch (error) {
      console.warn("[NPM Advisor] Failed to clear persistent stats:", error);
    }
  },
};
