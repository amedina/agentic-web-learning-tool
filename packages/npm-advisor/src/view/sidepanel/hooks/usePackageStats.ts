/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../lib";

// Cache to prevent reloading state when returning to a previously visited tab
const urlCache = new Map<
  string,
  { stats: PackageStats | null; error: string | null }
>();

export const usePackageStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null);
  const [isNavigationMessage, setIsNavigationMessage] = useState(false);
  const [isOptionsPage, setIsOptionsPage] = useState(false);
  const [isComparisonPage, setIsComparisonPage] = useState(false);
  const [stats, setStats] = useState<PackageStats | null>(null);
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
          setIsNavigationMessage(!cached.stats && !cached.error);
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        setIsNavigationMessage(false);

        let packageName: string | null = null;
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
          }
        }

        if (!packageName) {
          urlCache.set(url, { stats: null, error: null });
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
              urlCache.set(url, { stats: null, error: errorMessage });
              setLoading(false);
              return setError(errorMessage);
            }
            if (response && response.success) {
              if (response.data) {
                urlCache.set(url, { stats: response.data, error: null });
                setStats(response.data);
              } else {
                const errorMessage =
                  "Failed to load statistics for this package.";
                urlCache.set(url, { stats: null, error: errorMessage });
                setError(errorMessage);
              }
            } else {
              const errorMessage =
                response?.error ||
                "Failed to load statistics for this package.";
              urlCache.set(url, { stats: null, error: errorMessage });
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

    const handleHistoryStateUpdated = async (
      details: chrome.webNavigation.WebNavigationTransitionCallbackDetails,
    ) => {
      const { tabId, frameId, url } = details;
      const currentTab = (
        await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })
      )?.[0];

      if (chrome.runtime.lastError) return;

      if (frameId !== 0 || tabId !== currentTab?.id) {
        return;
      }

      fetchCurrentTabStats(url);
    };

    const handleTabActivated = (activeInfo: { tabId: number }) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab) fetchCurrentTabStats(tab.url);
      });
    };

    const handleTabUpdated = (tabId: number) => {
      chrome.tabs.get(tabId, (tab) => {
        if (tab) fetchCurrentTabStats(tab.url);
      });
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
  };
};
