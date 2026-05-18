/**
 * External dependencies
 */
import {
  fetchBundlephobiaData,
  getDependencyTree,
  configureGithubAuth,
} from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies
 */
import { packageStatsService } from "./services/packageStats";
import { npmSearchService } from "./services/npmSearch";
import { githubAuthService } from "./services/githubAuth";
import "./chromeListeners";

configureGithubAuth({ getToken: () => githubAuthService.getToken() });

/**
 * How long deferred bundle / dependency-tree fetches stay cached before being
 * refreshed. Mirrors `STATS_CACHE_TTL_MS` in `packageStats.ts` so every cache
 * the side panel touches expires on the same daily cadence.
 */
const DEFERRED_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Tiny in-memory caches for deferred fetches. Live on the service worker,
// so the same package only hits the upstream once per service-worker
// lifetime even if multiple accordion rows expand it.
const bundleDataCache = new Map<string, Promise<unknown> | unknown>();
const bundleDataCacheTimestamps = new Map<string, number>();
const depTreeCache = new Map<string, Promise<unknown> | unknown>();
const depTreeCacheTimestamps = new Map<string, number>();

/**
 * Returns true when the named entry has a recorded timestamp older than the
 * supplied TTL. Entries without a timestamp (in-flight promises) are treated
 * as fresh so concurrent readers still share the same request.
 */
function isCacheExpired(
  timestamps: Map<string, number>,
  key: string,
  ttlMs: number,
): boolean {
  const stampedAt = timestamps.get(key);
  if (stampedAt === undefined) {
    return false;
  }
  return Date.now() - stampedAt > ttlMs;
}

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

  // 2b. Get Light Package Stats (no transitive dependency tree). Used by the
  // Report tab so analysing 30+ deps doesn't trigger recursive npm fetches.
  // An optional `dependencyCategory` (runtime / dev / unknown) tailors the
  // scoring so dev-only packages aren't penalised for bundle size.
  else if (request.type === "GET_LIGHT_STATS" && request.packageName) {
    packageStatsService
      .getLightStats(request.packageName, request.dependencyCategory)
      .then((stats) => sendResponse({ success: true, data: stats }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 2c. Fetch just the bundlephobia bundle data for a package. Used by the
  // Report tab when the user expands an accordion row — light stats omit
  // the bundle fetch to keep the initial scan cheap, so we lazy-load it on
  // demand. Cached on the service worker so repeated expands don't re-hit
  // bundlephobia.
  else if (request.type === "GET_BUNDLE_DATA" && request.packageName) {
    const { packageName } = request;
    if (
      isCacheExpired(
        bundleDataCacheTimestamps,
        packageName,
        DEFERRED_CACHE_TTL_MS,
      )
    ) {
      bundleDataCache.delete(packageName);
      bundleDataCacheTimestamps.delete(packageName);
    }
    let cached = bundleDataCache.get(packageName);
    if (!cached) {
      const promise = fetchBundlephobiaData(packageName)
        .then((data) => {
          bundleDataCache.set(packageName, data);
          bundleDataCacheTimestamps.set(packageName, Date.now());
          return data;
        })
        .catch((error) => {
          bundleDataCache.delete(packageName);
          bundleDataCacheTimestamps.delete(packageName);
          throw error;
        });
      bundleDataCache.set(packageName, promise);
      cached = promise;
    }
    Promise.resolve(cached)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) =>
        sendResponse({
          success: false,
          error: (err as Error)?.message ?? "Bundle fetch failed",
        }),
      );
    return true;
  }

  // 2d. Fetch the transitive dependency tree for a package. Same lazy
  // pattern as the bundle data above — light stats omit it because
  // resolving the tree fans out into recursive npm fetches that we don't
  // want to pay for unless the user actually opens the accordion row.
  else if (request.type === "GET_DEP_TREE" && request.packageName) {
    const { packageName } = request;
    if (
      isCacheExpired(depTreeCacheTimestamps, packageName, DEFERRED_CACHE_TTL_MS)
    ) {
      depTreeCache.delete(packageName);
      depTreeCacheTimestamps.delete(packageName);
    }
    let cached = depTreeCache.get(packageName);
    if (!cached) {
      const promise = getDependencyTree(packageName)
        .then((data) => {
          depTreeCache.set(packageName, data);
          depTreeCacheTimestamps.set(packageName, Date.now());
          return data;
        })
        .catch((error) => {
          depTreeCache.delete(packageName);
          depTreeCacheTimestamps.delete(packageName);
          throw error;
        });
      depTreeCache.set(packageName, promise);
      cached = promise;
    }
    Promise.resolve(cached)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) =>
        sendResponse({
          success: false,
          error: (err as Error)?.message ?? "Dependency tree fetch failed",
        }),
      );
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

    chrome.storage.local.get(["comparisonBucket"], (res) => {
      const bucket = (res.comparisonBucket || []) as Record<string, unknown>[];
      const exists = bucket.some(
        (pkg) => pkg.packageName === packageName || pkg.name === packageName,
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

  // 6. Open Options Page on the Settings tab (used by the GitHub rate-limit
  // toast to deep-link the user to the PAT input).
  else if (request.type === "OPEN_OPTIONS_SETTINGS") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("options/options.html#settings"),
    });
    sendResponse({ success: true });
  }
});
