import { getPackageStats, type PackageStats } from "../utils/stats";

// Memory cache for promises or resolved stats
const statsCache = new Map<
  string,
  Promise<PackageStats | null> | PackageStats | null
>();

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "PREFETCH" && request.packageName) {
    const { packageName } = request;
    // Only prefetch if not already in cache
    if (!statsCache.has(packageName)) {
      console.log(`[NPM Advisor] Prefetching stats for ${packageName}...`);
      const promise = getPackageStats(packageName)
        .then((stats) => {
          // Cache the resolved result
          statsCache.set(packageName, stats);
          return stats;
        })
        .catch((err) => {
          // Remove from cache on failure so we can try again later
          statsCache.delete(packageName);
          throw err;
        });
      statsCache.set(packageName, promise);
    }
    // No response needed for prefetch
    sendResponse({ status: "prefetching" });
  } else if (request.type === "GET_STATS" && request.packageName) {
    const { packageName } = request;

    let statsData = statsCache.get(packageName);

    if (!statsData) {
      console.log(
        `[NPM Advisor] Cache miss for ${packageName}, fetching now...`,
      );
      statsData = getPackageStats(packageName)
        .then((stats) => {
          statsCache.set(packageName, stats);
          return stats;
        })
        .catch((err) => {
          statsCache.delete(packageName);
          throw err;
        });
      statsCache.set(packageName, statsData);
    } else {
      console.log(`[NPM Advisor] Cache hit for ${packageName}`);
    }

    // Handle both resolved stats and pending promises
    if (statsData instanceof Promise) {
      statsData
        .then((stats) => sendResponse({ success: true, data: stats }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
    } else {
      sendResponse({ success: true, data: statsData });
    }

    // Return true to indicate we will send a response asynchronously
    return true;
  }
});
