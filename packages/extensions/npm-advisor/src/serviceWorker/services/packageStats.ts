/**
 * Internal dependencies
 */
import {
  getPackageStats,
  type PackageStats,
  DEFAULT_TARGET_PROJECT_LICENSE,
} from "../../lib";
import { storageService } from "./storage";

/**
 * Package Stats Service.
 * Manages fetching, caching, and prefetching of package statistics.
 */
class PackageStatsService {
  private statsCache = new Map<
    string,
    Promise<PackageStats | null> | PackageStats | null
  >();
  private lightStatsCache = new Map<
    string,
    Promise<PackageStats | null> | PackageStats | null
  >();

  /**
   * Prefetch stats for a package if not already cached.
   */
  async prefetch(packageName: string): Promise<void> {
    if (this.statsCache.has(packageName)) return;

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
        return stats;
      } catch (err) {
        this.statsCache.delete(packageName);
        console.error(`[NPM Advisor] Prefetch failed for ${packageName}:`, err);
        return null;
      }
    })();

    this.statsCache.set(packageName, promise);
  }

  /**
   * Get stats for a package, using cache if available.
   */
  async getStats(packageName: string): Promise<PackageStats | null> {
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
          this.statsCache.set(packageName, stats);
          return stats;
        } catch (err) {
          this.statsCache.delete(packageName);
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
   */
  async getLightStats(packageName: string): Promise<PackageStats | null> {
    const full = this.statsCache.get(packageName);
    if (full) {
      return full instanceof Promise ? await full : full;
    }

    let cached = this.lightStatsCache.get(packageName);

    if (!cached) {
      console.log(
        `[NPM Advisor] Light cache miss for ${packageName}, fetching now...`,
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
          });
          this.lightStatsCache.set(packageName, stats);
          return stats;
        } catch (err) {
          this.lightStatsCache.delete(packageName);
          throw err;
        }
      })();

      cached = promise;
      this.lightStatsCache.set(packageName, promise);
    } else {
      console.log(`[NPM Advisor] Light cache hit for ${packageName}`);
    }

    return cached instanceof Promise ? await cached : cached;
  }
}

export const packageStatsService = new PackageStatsService();
