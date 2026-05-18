/**
 * External dependencies
 */
import {
  getPackageStats,
  type PackageStats,
  type DependencyCategory,
  DEFAULT_TARGET_PROJECT_LICENSE,
} from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies
 */
import { storageService } from "./storage";

/**
 * How long a cached PackageStats entry stays fresh before being re-fetched.
 * Matches the user-visible expectation that package stats refresh once a day
 * without needing to manually reload the extension.
 */
const STATS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type StatsCacheValue = Promise<PackageStats | null> | PackageStats | null;

/**
 * Package Stats Service.
 * Manages fetching, caching, and prefetching of package statistics.
 */
class PackageStatsService {
  private statsCache = new Map<string, StatsCacheValue>();
  private statsCacheTimestamps = new Map<string, number>();
  private lightStatsCache = new Map<string, StatsCacheValue>();
  private lightStatsCacheTimestamps = new Map<string, number>();

  /**
   * Returns true if the key has a recorded timestamp older than the TTL.
   * In-flight promises have no timestamp yet and are therefore treated as fresh.
   */
  private isExpired(timestamps: Map<string, number>, key: string): boolean {
    const stampedAt = timestamps.get(key);
    if (stampedAt === undefined) {
      return false;
    }
    return Date.now() - stampedAt > STATS_CACHE_TTL_MS;
  }

  /**
   * Prefetch stats for a package if not already cached.
   */
  async prefetch(packageName: string): Promise<void> {
    if (
      this.statsCache.has(packageName) &&
      !this.isExpired(this.statsCacheTimestamps, packageName)
    ) {
      return;
    }

    // Drop the stale timestamp before kicking off a replacement fetch, so a
    // concurrent `getStats` doesn't see the in-flight promise as expired and
    // race a second request.
    this.statsCacheTimestamps.delete(packageName);

    console.log(`[NPM Advisor] Prefetching stats for ${packageName}...`);

    const promise = (async () => {
      try {
        const result = await storageService.getSync("targetLicense");
        const targetLicense =
          typeof result.targetLicense === "string"
            ? result.targetLicense
            : DEFAULT_TARGET_PROJECT_LICENSE;

        const stats = await getPackageStats(packageName, targetLicense);
        this.statsCache.set(packageName, stats);
        this.statsCacheTimestamps.set(packageName, Date.now());
        return stats;
      } catch (err) {
        this.statsCache.delete(packageName);
        this.statsCacheTimestamps.delete(packageName);
        console.error(`[NPM Advisor] Prefetch failed for ${packageName}:`, err);
        return null;
      }
    })();

    this.statsCache.set(packageName, promise);
  }

  /**
   * Get stats for a package, using cache if available.
   *
   * Entries older than `STATS_CACHE_TTL_MS` are evicted before lookup so the
   * panel automatically refreshes once a day without the user having to reload
   * the extension.
   */
  async getStats(packageName: string): Promise<PackageStats | null> {
    if (this.isExpired(this.statsCacheTimestamps, packageName)) {
      this.statsCache.delete(packageName);
      this.statsCacheTimestamps.delete(packageName);
    }

    let statsData = this.statsCache.get(packageName);

    if (!statsData) {
      console.log(
        `[NPM Advisor] Cache miss for ${packageName}, fetching now...`,
      );
      const promise = (async () => {
        try {
          const result = await storageService.getSync("targetLicense");
          const targetLicense =
            typeof result.targetLicense === "string"
              ? result.targetLicense
              : DEFAULT_TARGET_PROJECT_LICENSE;

          const stats = await getPackageStats(packageName, targetLicense);
          if (stats?.githubRateLimited || stats?.githubIssuesUnavailable) {
            // Don't cache rate-limited or search-throttled results — once the
            // limit resets the next read should retry, not replay the partial answer.
            this.statsCache.delete(packageName);
            this.statsCacheTimestamps.delete(packageName);
          } else {
            this.statsCache.set(packageName, stats);
            this.statsCacheTimestamps.set(packageName, Date.now());
          }
          return stats;
        } catch (err) {
          this.statsCache.delete(packageName);
          this.statsCacheTimestamps.delete(packageName);
          throw err;
        }
      })();

      statsData = promise;
      this.statsCache.set(packageName, promise);
    } else {
      console.log(`[NPM Advisor] Cache hit for ${packageName}`);
    }

    return statsData instanceof Promise ? await statsData : statsData;
  }

  /**
   * Get light stats for a package (omits the transitive dependency tree).
   *
   * If the package already has full stats cached, reuse them — a full result
   * is always a superset of the light result. Otherwise fetch and cache
   * separately so a later full `getStats` call can still populate the tree.
   *
   * The light cache is keyed by `${packageName}::${category}` so that the
   * same package scored under different dependency categories (e.g. runtime
   * vs dev) has independent entries; the scoring rules differ per category.
   */
  async getLightStats(
    packageName: string,
    dependencyCategory: DependencyCategory = "unknown",
  ): Promise<PackageStats | null> {
    if (this.isExpired(this.statsCacheTimestamps, packageName)) {
      this.statsCache.delete(packageName);
      this.statsCacheTimestamps.delete(packageName);
    }
    const full = this.statsCache.get(packageName);
    if (full) {
      return full instanceof Promise ? await full : full;
    }

    const cacheKey = `${packageName}::${dependencyCategory}`;
    if (this.isExpired(this.lightStatsCacheTimestamps, cacheKey)) {
      this.lightStatsCache.delete(cacheKey);
      this.lightStatsCacheTimestamps.delete(cacheKey);
    }
    let cached = this.lightStatsCache.get(cacheKey);

    if (!cached) {
      console.log(
        `[NPM Advisor] Light cache miss for ${cacheKey}, fetching now...`,
      );
      const promise = (async () => {
        try {
          const result = await storageService.getSync("targetLicense");
          const targetLicense =
            typeof result.targetLicense === "string"
              ? result.targetLicense
              : DEFAULT_TARGET_PROJECT_LICENSE;

          const stats = await getPackageStats(packageName, targetLicense, {
            includeDependencyTree: false,
            // Defer bundlephobia until the user actually expands the row.
            // Avoids a network round-trip per dep when most aren't opened.
            includeBundle: false,
            // Skip GitHub issues for Report-tab dep scans — the Search API
            // quota (10 req/min unauth) is exhausted quickly when 30+ deps
            // are fetched in parallel, causing silent 0-result responses.
            includeGithubIssues: false,
            dependencyCategory,
          });
          if (stats?.githubRateLimited || stats?.githubIssuesUnavailable) {
            this.lightStatsCache.delete(cacheKey);
            this.lightStatsCacheTimestamps.delete(cacheKey);
          } else {
            this.lightStatsCache.set(cacheKey, stats);
            this.lightStatsCacheTimestamps.set(cacheKey, Date.now());
          }
          return stats;
        } catch (err) {
          this.lightStatsCache.delete(cacheKey);
          this.lightStatsCacheTimestamps.delete(cacheKey);
          throw err;
        }
      })();

      cached = promise;
      this.lightStatsCache.set(cacheKey, promise);
    } else {
      console.log(`[NPM Advisor] Light cache hit for ${cacheKey}`);
    }

    return cached instanceof Promise ? await cached : cached;
  }

  /**
   * Drops every cached stats entry (both full and light) and their timestamps.
   * Called from the manual refresh flow so the next read goes back to the
   * network instead of replaying whatever was cached.
   */
  clearAll(): void {
    this.statsCache.clear();
    this.statsCacheTimestamps.clear();
    this.lightStatsCache.clear();
    this.lightStatsCacheTimestamps.clear();
  }
}

export const packageStatsService = new PackageStatsService();
