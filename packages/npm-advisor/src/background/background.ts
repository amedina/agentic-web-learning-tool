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
      })
      .then((results) => sendResponse({ success: true, ...results }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
