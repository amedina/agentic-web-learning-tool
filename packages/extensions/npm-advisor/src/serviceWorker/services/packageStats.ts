/**
 * Internal dependencies
 */
import {
  getPackageStats,
  type PackageStats,
  type DependencyCategory,
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
   *
   * The light cache is keyed by `${packageName}::${category}` so that the
   * same package scored under different dependency categories (e.g. runtime
   * vs dev) has independent entries; the scoring rules differ per category.
   */
  async getLightStats(
    packageName: string,
    dependencyCategory: DependencyCategory = "unknown",
  ): Promise<PackageStats | null> {
    const full = this.statsCache.get(packageName);
    if (full) {
      return full instanceof Promise ? await full : full;
    }

    const cacheKey = `${packageName}::${dependencyCategory}`;
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
            dependencyCategory,
          });
          this.lightStatsCache.set(cacheKey, stats);
          return stats;
        } catch (err) {
          this.lightStatsCache.delete(cacheKey);
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
}

export const packageStatsService = new PackageStatsService();
