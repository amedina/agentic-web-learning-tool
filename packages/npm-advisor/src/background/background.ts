import { getPackageStats, type PackageStats } from "../utils/stats";
import { DEFAULT_TARGET_PROJECT_LICENSE } from "../utils/license";

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

      const promise = new Promise<PackageStats | null>((resolve, reject) => {
        chrome.storage.sync.get(["targetLicense"], (result) => {
          const targetLicense =
            typeof result.targetLicense === "string"
              ? result.targetLicense
              : DEFAULT_TARGET_PROJECT_LICENSE;
          getPackageStats(packageName, targetLicense)
            .then((stats) => {
              statsCache.set(packageName, stats);
              resolve(stats);
            })
            .catch((err) => {
              statsCache.delete(packageName);
              reject(err);
            });
        });
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

      const promise = new Promise<PackageStats | null>((resolve, reject) => {
        chrome.storage.sync.get(["targetLicense"], (result) => {
          const targetLicense =
            typeof result.targetLicense === "string"
              ? result.targetLicense
              : DEFAULT_TARGET_PROJECT_LICENSE;
          getPackageStats(packageName, targetLicense)
            .then((stats) => {
              statsCache.set(packageName, stats);
              resolve(stats);
            })
            .catch((err) => {
              statsCache.delete(packageName);
              reject(err);
            });
        });
      });

      statsData = promise;
      statsCache.set(packageName, promise);
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
