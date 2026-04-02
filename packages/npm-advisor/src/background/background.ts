import { getPackageStats, type PackageStats } from "../utils";
import { DEFAULT_TARGET_PROJECT_LICENSE } from "../utils";
import { NPM_SEARCH_CONFIG } from "../constants";

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
  } else if (request.type === "SEARCH_NPM" && request.query) {
    const { appId, apiKey, indexName } = NPM_SEARCH_CONFIG;
    const url = `https://${appId.toLowerCase()}-dsn.algolia.net/1/indexes/${indexName}/query`;

    console.log(
      `[NPM Advisor] Searching for "${request.query}" with filters:`,
      request.facetFilters,
    );

    const filterString =
      request.facetFilters && request.facetFilters.length > 0
        ? request.facetFilters
            .map((f: string) => {
              const [key, value] = f.split(":");
              return `${key}:"${value}"`;
            })
            .join(" AND ")
        : "";

    fetch(url, {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": appId,
        "X-Algolia-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: request.query || "",
        filters: filterString,
        hitsPerPage: 10,
        attributesToRetrieve: [
          "name",
          "version",
          "description",
          "modified",
          "homepage",
          "repository",
          "owners",
          "downloadsLast30Days",
          "popular",
          "keywords",
          "deprecated",
          "isDeprecated",
          "license",
        ],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(`[NPM Advisor] Search results:`, data.nbHits, "hits");
        sendResponse({ success: true, hits: data.hits || [] });
      })
      .catch((err) => {
        console.error("[NPM Advisor] Search failed:", err);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }
});
