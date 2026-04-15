import { packageStatsService } from "./services/packageStats";
import { npmSearchService } from "./services/npmSearch";
import "./chromeListeners";

/**
 * Background Service Worker.
 * Acts as a router for incoming messages from content scripts and UI views.
 */
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  // 1. Prefetch Stats
  if (request.type === "PREFETCH" && request.packageName) {
    packageStatsService.prefetch(request.packageName);
    sendResponse({ status: "prefetching" });
  }

  // 2. Get Package Stats (with cache)
  else if (request.type === "GET_STATS" && request.packageName) {
    packageStatsService
      .getStats(request.packageName)
      .then((stats) => sendResponse({ success: true, data: stats }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 3. Search NPM Packages (via Algolia)
  else if (request.type === "SEARCH_NPM" && request.query !== undefined) {
    npmSearchService
      .search({
        query: request.query,
        page: request.page,
        hitsPerPage: request.hitsPerPage,
        facetFilters: request.facetFilters,
        numericFilters: request.numericFilters,
        filters: request.filters,
      })
      .then((results) => sendResponse({ success: true, ...results }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 4. Add to Comparison Bucket
  else if (request.type === "ADD_TO_COMPARISON" && request.package) {
    const packageName = request.package.name;

    chrome.storage.local.get(["comparisonBucket"], (res: any) => {
      const bucket = (res.comparisonBucket || []) as any[];
      const exists = bucket.some(
        (pkg: any) =>
          pkg.packageName === packageName || pkg.name === packageName,
      );

      if (exists) {
        sendResponse({
          success: true,
          added: false,
          message: "Package already in comparison",
        });
        return;
      }

      packageStatsService
        .getStats(packageName)
        .then((stats) => {
          if (stats) {
            const newBucket = [...bucket, stats];
            chrome.storage.local.set({ comparisonBucket: newBucket }, () => {
              sendResponse({ success: true, added: true, data: stats });
            });
          } else {
            sendResponse({
              success: false,
              error: "Failed to calculate stats for comparison",
            });
          }
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
    });
    return true;
  }

  // 5. Open Options Page
  else if (request.type === "OPEN_OPTIONS") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("options/options.html#comparison"),
    });
    sendResponse({ success: true });
  }
});
