/**
 * External dependencies.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { type PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { showGithubRateLimitToastOnce } from "../utils/githubRateLimitToast";

export interface PackageJsonDependencies {
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
}

/**
 * How long a per-URL cache entry stays fresh before the panel re-fetches.
 * Matches the service worker's stats cache TTL so the daily refresh cadence
 * is consistent end-to-end.
 */
const URL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface UrlCacheEntry {
  stats: PackageStats | null;
  error: string | null;
  notice: string | null;
  packageJsonDependencies: PackageJsonDependencies | null;
  cachedAt: number;
}

// Cache to prevent reloading state when returning to a previously visited tab.
// Entries older than `URL_CACHE_TTL_MS` are treated as misses so the panel
// automatically pulls fresh stats once a day without a manual refresh.
const urlCache = new Map<string, UrlCacheEntry>();

/**
 * Reads a URL cache entry but treats anything older than `URL_CACHE_TTL_MS`
 * as a miss (and evicts it).
 */
const readFreshUrlCacheEntry = (url: string): UrlCacheEntry | null => {
  const entry = urlCache.get(url);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.cachedAt > URL_CACHE_TTL_MS) {
    urlCache.delete(url);
    return null;
  }
  return entry;
};

const extractDependencies = (pkg: any): PackageJsonDependencies => ({
  dependencies: pkg?.dependencies ? Object.keys(pkg.dependencies) : [],
  devDependencies: pkg?.devDependencies ? Object.keys(pkg.devDependencies) : [],
  peerDependencies: pkg?.peerDependencies
    ? Object.keys(pkg.peerDependencies)
    : [],
});

/**
 * Extracts the package name we expect the panel to display, derived from
 * the URL alone. Lets the side panel render the header / suggestions /
 * Ask AI prompt with the right name *before* the stats fetch completes,
 * so the shell feels immediate even on a cold cache.
 */
export const getPackageNameFromUrl = (
  url: string | undefined,
): string | null => {
  if (!url) return null;
  if (url.includes("npmjs.com/package/")) {
    const match = url.match(/npmjs\.com\/package\/([^?#]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
};

export const usePackageStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null);
  const [pendingPackageName, setPendingPackageName] = useState<string | null>(
    null,
  );
  const [isNavigationMessage, setIsNavigationMessage] = useState(false);
  const [isOptionsPage, setIsOptionsPage] = useState(false);
  const [isComparisonPage, setIsComparisonPage] = useState(false);
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [packageJsonDependencies, setPackageJsonDependencies] =
    useState<PackageJsonDependencies | null>(null);
  const [comparisonBucket, setComparisonBucket] = useState<any[]>([]);
  const [addingRecommendations, setAddingRecommendations] = useState<
    Set<string>
  >(new Set());
  // Bumped every time the user clicks the refresh button. Surfaced to the
  // side panel so it can use it as a React `key` on the Dependencies tab,
  // forcing the analyzer-ui widget to remount and re-query each row's stats
  // against the (now-empty) service-worker caches.
  const [refreshKey, setRefreshKey] = useState(0);
  // True between the moment the user clicks Refresh and the moment the
  // active-tab fetch plus the comparison-bucket re-fetches all settle. The
  // header reads this to spin its icon and disable the button so repeat
  // clicks during the in-flight pass are ignored.
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Holds the latest in-effect `fetchCurrentTabStats` so the `refresh()`
  // callback exposed below can re-run the fetch without re-creating all the
  // chrome.tabs listeners attached inside the effect.
  const fetchCurrentTabStatsRef = useRef<
    | ((
        overrideUrl?: string,
        options?: { keepStaleData?: boolean },
      ) => Promise<void>)
    | null
  >(null);
  // Snapshot of the comparison bucket usable from the (deps-free) refresh
  // callback. Without this, refresh() would need `comparisonBucket` in its
  // deps and would tear down/recreate every render.
  const comparisonBucketRef = useRef<any[]>([]);
  comparisonBucketRef.current = comparisonBucket;

  useEffect(() => {
    chrome.storage.local.get(["comparisonBucket"], (res) => {
      setComparisonBucket(res.comparisonBucket ?? []);
    });

    const storageListener = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      if ("comparisonBucket" in changes) {
        setComparisonBucket(changes.comparisonBucket.newValue ?? []);
      }
    };
    chrome.storage.local.onChanged.addListener(storageListener);

    const fetchCurrentTabStats = async (
      overrideUrl?: string,
      options?: { keepStaleData?: boolean },
    ) => {
      const keepStaleData = options?.keepStaleData ?? false;
      try {
        let url = overrideUrl;
        if (!url) {
          // 1. Query chrome active tab
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          url = tab?.url;
        }

        if (!url) {
          throw new Error("Could not determine current tab URL.");
        }

        setCurrentTabUrl(url as string);
        setPendingPackageName(getPackageNameFromUrl(url));

        if (url.startsWith("chrome-extension://")) {
          setIsOptionsPage(true);
          setIsComparisonPage(url.includes("#comparison"));
          setStats(null);
          setPackageJsonDependencies(null);
          setError(null);
          setNotice(null);
          setIsNavigationMessage(false);
          setLoading(false);
          return;
        }

        setIsOptionsPage(false);
        setIsComparisonPage(false);

        const cached = readFreshUrlCacheEntry(url);
        if (cached) {
          setStats(cached.stats);
          setError(cached.error);
          setNotice(cached.notice);
          setPackageJsonDependencies(cached.packageJsonDependencies);
          setIsNavigationMessage(
            !cached.stats && !cached.error && !cached.notice,
          );
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        setNotice(null);
        setIsNavigationMessage(false);
        // Always null `stats` so the Insights tab snaps back to its
        // skeleton/loader state (numbers reset, shimmers visible) for the
        // duration of the fetch — same UX as first-open of the panel.
        setStats(null);
        // On URL changes, also null `packageJsonDependencies` so the
        // previous file's deps don't linger. On a manual refresh of the
        // same file we keep them — nulling would briefly remove the
        // Dependencies tab from the tablist, which the chatbot
        // PropProvider reacts to by switching the active tab back to
        // Insights. The Dependencies widget itself is remounted via the
        // refreshKey-based React `key`, so each row still resets to its
        // own loading skeleton.
        if (!keepStaleData) {
          setPackageJsonDependencies(null);
        }

        let packageName: string | null = null;
        let parsedDependencies: PackageJsonDependencies | null = null;
        if (url.includes("npmjs.com/package/")) {
          const match = url.match(/npmjs\.com\/package\/([^?#]+)/);
          if (match && match[1]) {
            packageName = decodeURIComponent(match[1]);
          }
        } else if (
          url.includes("github.com") &&
          url.endsWith("package.json") &&
          url.includes("/blob/")
        ) {
          const rawUrl = url.replace("/blob/", "/raw/");
          const response = await fetch(rawUrl);
          if (response.ok) {
            const pkg = await response.json();
            if (pkg && pkg.name) {
              packageName = pkg.name;
              setPendingPackageName(pkg.name);
            }
            parsedDependencies = extractDependencies(pkg);
          }
        }

        const hasAnyDeclaredDep =
          !!parsedDependencies &&
          (parsedDependencies.dependencies.length > 0 ||
            parsedDependencies.devDependencies.length > 0 ||
            parsedDependencies.peerDependencies.length > 0);
        const dependenciesToExpose = hasAnyDeclaredDep
          ? parsedDependencies
          : null;
        setPackageJsonDependencies(dependenciesToExpose);

        if (!packageName) {
          urlCache.set(url, {
            stats: null,
            error: null,
            notice: null,
            packageJsonDependencies: dependenciesToExpose,
            cachedAt: Date.now(),
          });
          setIsNavigationMessage(true);
          setStats(null);
          setLoading(false);
          return;
        }

        // Ask background script for the cached stats payload
        chrome.runtime.sendMessage(
          { type: "GET_STATS", packageName },
          (response) => {
            if (chrome.runtime.lastError) {
              const errorMessage =
                chrome.runtime.lastError.message ||
                "Failed to communicate with background script.";
              urlCache.set(url, {
                stats: null,
                error: errorMessage,
                notice: null,
                packageJsonDependencies: dependenciesToExpose,
                cachedAt: Date.now(),
              });
              setLoading(false);
              return setError(errorMessage);
            }
            if (response && response.success) {
              if (response.data) {
                // Don't cache rate-limited or search-throttled results so the
                // next visit retries once the limit resets or the user adds a token.
                if (
                  !response.data.githubRateLimited &&
                  !response.data.githubIssuesUnavailable
                ) {
                  urlCache.set(url, {
                    stats: response.data,
                    error: null,
                    notice: null,
                    packageJsonDependencies: dependenciesToExpose,
                    cachedAt: Date.now(),
                  });
                }
                setStats(response.data);
              } else {
                // Package isn't published / npm returned 404 — that's a
                // benign state, not a failure. Surface it through `notice`
                // so the panel renders an info card instead of the red
                // error UI.
                const noticeMessage =
                  "This package was not found on npmjs.com. It may not be published.";
                urlCache.set(url, {
                  stats: null,
                  error: null,
                  notice: noticeMessage,
                  packageJsonDependencies: dependenciesToExpose,
                  cachedAt: Date.now(),
                });
                setNotice(noticeMessage);
              }
            } else {
              const errorMessage =
                response?.error ||
                "Failed to load statistics for this package.";
              urlCache.set(url, {
                stats: null,
                error: errorMessage,
                notice: null,
                packageJsonDependencies: dependenciesToExpose,
                cachedAt: Date.now(),
              });
              setError(errorMessage);
            }
            setLoading(false);
          },
        );
      } catch (err: any) {
        const message = err.message || "An unknown error occurred.";
        setError(message);
        setLoading(false);
      }
    };

    fetchCurrentTabStatsRef.current = fetchCurrentTabStats;
    fetchCurrentTabStats();

    // Each side panel instance is bound to a specific tab via the hash
    // configured by `configureTabPanel` (#tab=<id>). Without pinning the
    // listeners to that tab id, opening an external link in a new tab
    // (or any other tab gaining focus / updating its URL) would wipe this
    // panel's loaded stats and start refetching for the unrelated URL.
    const boundTabIdMatch = window.location.hash.match(/tab=(\d+)/);
    const boundTabId = boundTabIdMatch ? Number(boundTabIdMatch[1]) : null;

    // Listeners are scoped to the bound tab id (set above). We deliberately
    // *don't* pre-filter by `isPanelRelevantUrl` here — `fetchCurrentTabStats`
    // already routes non-package URLs to the NavigationMessage path, and
    // pre-filtering would freeze the panel on the previous package when the
    // user navigates away from a /package/ URL on the same tab (e.g. clicks
    // the npmjs.com logo to go home).
    const handleHistoryStateUpdated = (
      details: chrome.webNavigation.WebNavigationTransitionCallbackDetails,
    ) => {
      const { tabId, frameId, url } = details;
      if (frameId !== 0) return;
      if (boundTabId !== null && tabId !== boundTabId) return;
      fetchCurrentTabStats(url);
    };

    const handleTabActivated = (activeInfo: { tabId: number }) => {
      if (boundTabId !== null && activeInfo.tabId !== boundTabId) return;
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab?.url) {
          fetchCurrentTabStats(tab.url);
        }
      });
    };

    const handleTabUpdated = (
      tabId: number,
      changeInfo: { url?: string },
      tab: chrome.tabs.Tab,
    ) => {
      if (boundTabId !== null && tabId !== boundTabId) return;
      // Skip non-navigation updates (title, favicon, loading state) so we
      // don't refetch on every micro-update the active page emits.
      if (!changeInfo.url) return;
      fetchCurrentTabStats(tab.url);
    };

    chrome.webNavigation.onHistoryStateUpdated.addListener(
      handleHistoryStateUpdated,
    );
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    chrome.tabs.onActivated.addListener(handleTabActivated);

    return () => {
      chrome.storage.local.onChanged.removeListener(storageListener);
      chrome.webNavigation.onHistoryStateUpdated.removeListener(
        handleHistoryStateUpdated,
      );
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, []);

  const handleAddToCompare = () => {
    if (!stats) return;
    const newBucket = [...comparisonBucket, stats];
    setComparisonBucket(newBucket);
    chrome.storage.local.set({ comparisonBucket: newBucket });
  };

  /**
   * Wipes the in-memory side-panel cache and the service-worker stats caches,
   * re-runs the active-tab fetch, and re-fetches every package in the
   * comparison bucket so its table data is replaced with fresh stats too.
   * Exposed to the side panel's refresh button.
   */
  const refresh = useCallback(() => {
    setIsRefreshing(true);
    // Flip immediately to skeleton state — don't wait for the
    // CLEAR_STATS_CACHE round-trip — so the Insights tab visibly resets
    // numbers/shimmers the moment the user clicks. The Dependencies tab's
    // per-row skeletons come from the key-bump remount below.
    setStats(null);
    setLoading(true);
    urlCache.clear();
    chrome.runtime.sendMessage({ type: "CLEAR_STATS_CACHE" }, () => {
      // Ignore lastError — even if the service worker is asleep, the next
      // GET_STATS the fetch fires will revive it and hit fresh upstreams.
      void chrome.runtime.lastError;
      // Bump the refresh key. Consumers use this as part of a React `key`
      // on the Dependencies tab to force the analyzer-ui widget to remount,
      // which is what actually triggers re-fetches for each row — the
      // mounted widget caches each row's stats in its own state and won't
      // re-query just because the service-worker cache was cleared.
      setRefreshKey((previous) => previous + 1);
      setLoading(true);
      setError(null);
      setNotice(null);
      setIsNavigationMessage(false);
      // Pass `keepStaleData` so the Dependencies tab stays mounted across
      // the refresh window — otherwise the tab disappears and the active
      // tab snaps back to Insights mid-refresh.
      const statsFetchPromise =
        fetchCurrentTabStatsRef.current?.(undefined, {
          keepStaleData: true,
        }) ?? Promise.resolve();

      // Comparison bucket items were saved with stats frozen at the time
      // they were added. Re-fetch each one against the now-empty service
      // worker cache and write the refreshed array back to storage; the
      // comparison table listens to storage changes and re-renders.
      const currentBucket = comparisonBucketRef.current;
      const bucketRefreshPromise =
        currentBucket.length === 0
          ? Promise.resolve()
          : Promise.all(
              currentBucket.map(
                (item) =>
                  new Promise<any>((resolve) => {
                    const packageName = item?.packageName ?? item?.name;
                    if (!packageName) {
                      resolve(item);
                      return;
                    }
                    chrome.runtime.sendMessage(
                      { type: "GET_STATS", packageName },
                      (response) => {
                        void chrome.runtime.lastError;
                        if (response?.success && response.data) {
                          resolve(response.data);
                          return;
                        }
                        // Fall back to the existing item on failure so the
                        // table doesn't go blank if one package fails to
                        // refresh.
                        resolve(item);
                      },
                    );
                  }),
              ),
            ).then((refreshed) => {
              setComparisonBucket(refreshed);
              chrome.storage.local.set({ comparisonBucket: refreshed });
            });

      // `finally` so a thrown error from either promise still flips the
      // header back out of the spinning state — otherwise the button would
      // be stuck disabled after a transient failure.
      Promise.allSettled([statsFetchPromise, bucketRefreshPromise]).then(() => {
        setIsRefreshing(false);
      });
    });
  }, []);

  const handleAddRecommendationToCompare = useCallback(
    (packageName: string) => {
      setAddingRecommendations((prev) => new Set(prev).add(packageName));
      chrome.runtime.sendMessage(
        { type: "GET_STATS", packageName },
        (response) => {
          setAddingRecommendations((prev) => {
            const next = new Set(prev);
            next.delete(packageName);
            return next;
          });
          if (response?.success && response.data) {
            setComparisonBucket((prev) => {
              const newBucket = [...prev, response.data];
              chrome.storage.local.set({ comparisonBucket: newBucket });
              return newBucket;
            });
          }
        },
      );
    },
    [],
  );

  // Surface the rate-limit toast in a render-driven effect so it always
  // fires after the Toaster has mounted. Firing from inside the
  // chrome.runtime.sendMessage callback was unreliable: on the very first
  // render the callback could resolve before any Toaster instance had
  // registered with sonner, and the toast would silently drop.
  useEffect(() => {
    if (stats?.githubRateLimited) {
      showGithubRateLimitToastOnce();
    }
  }, [stats?.githubRateLimited]);

  const isAddedToCompare = comparisonBucket.some(
    (item) => item?.packageName === stats?.packageName,
  );

  const comparisonBucketNames = new Set(
    comparisonBucket.map((item) => item?.packageName),
  );

  return {
    stats,
    loading,
    error,
    notice,
    isNavigationMessage,
    isOptionsPage,
    isComparisonPage,
    comparisonBucket,
    isAddedToCompare,
    handleAddToCompare,
    handleAddRecommendationToCompare,
    comparisonBucketNames,
    addingRecommendations,
    currentTabUrl,
    packageJsonDependencies,
    pendingPackageName,
    refresh,
    refreshKey,
    isRefreshing,
  };
};
