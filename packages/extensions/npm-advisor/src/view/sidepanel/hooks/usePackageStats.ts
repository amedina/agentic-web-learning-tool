/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../lib";
import { showGithubRateLimitToastOnce } from "../utils/githubRateLimitToast";

export interface PackageJsonDependencies {
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
}

// Cache to prevent reloading state when returning to a previously visited tab
const urlCache = new Map<
  string,
  {
    stats: PackageStats | null;
    error: string | null;
    packageJsonDependencies: PackageJsonDependencies | null;
  }
>();

const extractDependencies = (pkg: any): PackageJsonDependencies => ({
  dependencies: pkg?.dependencies ? Object.keys(pkg.dependencies) : [],
  devDependencies: pkg?.devDependencies ? Object.keys(pkg.devDependencies) : [],
  peerDependencies: pkg?.peerDependencies
    ? Object.keys(pkg.peerDependencies)
    : [],
});

/**
 * Returns true when the URL is one the panel would actually display stats
 * for. Used to ignore browser tab/window switches that move focus to an
 * unrelated page (docs, search, etc.) — without this guard the Report tab
 * would tear itself down and refetch dozens of dependency stats every time
 * the user glances at another tab. We also include the extension's own
 * options page so navigating to options doesn't lose the loaded report.
 */
const isPanelRelevantUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  if (url.startsWith("chrome-extension://")) return true;
  if (url.includes("npmjs.com/package/")) return true;
  if (
    url.includes("github.com") &&
    url.endsWith("package.json") &&
    url.includes("/blob/")
  ) {
    return true;
  }
  return false;
};

export const usePackageStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null);
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

    const fetchCurrentTabStats = async (overrideUrl?: string) => {
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

        if (url.startsWith("chrome-extension://")) {
          setIsOptionsPage(true);
          setIsComparisonPage(url.includes("#comparison"));
          setStats(null);
          setPackageJsonDependencies(null);
          setError(null);
          setIsNavigationMessage(false);
          setLoading(false);
          return;
        }

        setIsOptionsPage(false);
        setIsComparisonPage(false);

        if (urlCache.has(url)) {
          const cached = urlCache.get(url)!;
          setStats(cached.stats);
          setError(cached.error);
          setPackageJsonDependencies(cached.packageJsonDependencies);
          setIsNavigationMessage(!cached.stats && !cached.error);
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        setIsNavigationMessage(false);
        setPackageJsonDependencies(null);

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
            packageJsonDependencies: dependenciesToExpose,
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
                packageJsonDependencies: dependenciesToExpose,
              });
              setLoading(false);
              return setError(errorMessage);
            }
            if (response && response.success) {
              if (response.data) {
                // Don't cache a rate-limited result so the next visit retries
                // once the limit resets or the user adds a token. The toast
                // for the rate limit is fired from a useEffect below so it
                // always emits inside a render cycle where the Toaster is
                // guaranteed to be mounted.
                if (!response.data.githubRateLimited) {
                  urlCache.set(url, {
                    stats: response.data,
                    error: null,
                    packageJsonDependencies: dependenciesToExpose,
                  });
                }
                setStats(response.data);
              } else {
                const errorMessage =
                  "This package was not found on npmjs.com. It may not be published.";
                urlCache.set(url, {
                  stats: null,
                  error: errorMessage,
                  packageJsonDependencies: dependenciesToExpose,
                });
                setError(errorMessage);
              }
            } else {
              const errorMessage =
                response?.error ||
                "Failed to load statistics for this package.";
              urlCache.set(url, {
                stats: null,
                error: errorMessage,
                packageJsonDependencies: dependenciesToExpose,
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

    fetchCurrentTabStats();

    // Each side panel instance is bound to a specific tab via the hash
    // configured by `configureTabPanel` (#tab=<id>). Without pinning the
    // listeners to that tab id, opening an external link in a new tab
    // (or any other tab gaining focus / updating its URL) would wipe this
    // panel's loaded stats and start refetching for the unrelated URL.
    const boundTabIdMatch = window.location.hash.match(/tab=(\d+)/);
    const boundTabId = boundTabIdMatch ? Number(boundTabIdMatch[1]) : null;

    const handleHistoryStateUpdated = (
      details: chrome.webNavigation.WebNavigationTransitionCallbackDetails,
    ) => {
      const { tabId, frameId, url } = details;
      if (frameId !== 0) return;
      if (boundTabId !== null && tabId !== boundTabId) return;
      if (!isPanelRelevantUrl(url)) return;
      fetchCurrentTabStats(url);
    };

    const handleTabActivated = (activeInfo: { tabId: number }) => {
      if (boundTabId !== null && activeInfo.tabId !== boundTabId) return;
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && isPanelRelevantUrl(tab.url)) {
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
      if (!isPanelRelevantUrl(tab.url)) return;
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
  };
};
