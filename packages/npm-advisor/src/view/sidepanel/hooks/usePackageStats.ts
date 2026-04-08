/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../utils";

// Cache to prevent reloading state when returning to a previously visited tab
const urlCache = new Map<
  string,
  { stats: PackageStats | null; error: string | null }
>();

export const usePackageStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [comparisonBucket, setComparisonBucket] = useState<any[]>([]);
  const [addingRecommendations, setAddingRecommendations] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    chrome.storage.local.get(["comparisonBucket"], (res) => {
      if (res.comparisonBucket) {
        setComparisonBucket(res.comparisonBucket as any[]);
      }
    });

    const fetchCurrentTabStats = async () => {
      try {
        // 1. Query chrome active tab
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tab?.url;

        if (!url) {
          throw new Error("Could not determine current tab URL.");
        }

        if (urlCache.has(url)) {
          const cached = urlCache.get(url)!;
          setStats(cached.stats);
          setError(cached.error);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        let packageName: string | null = null;
        if (url.includes("npmjs.com/package/")) {
          const match = url.match(/npmjs\.com\/package\/([^/?#]+)/);
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
          const message =
            "Navigate to an NPM package or a GitHub package.json page to view stats.";
          urlCache.set(url, { stats: null, error: message });
          throw new Error(message);
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

    const handleTabUpdated = (tabId: number, changeInfo: any) => {
      if (changeInfo.status === "complete" || changeInfo.url) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id === tabId) {
            fetchCurrentTabStats();
          }
        });
      }
    };

    const handleTabActivated = () => {
      fetchCurrentTabStats();
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    return () => {
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
    isAddedToCompare,
    handleAddToCompare,
    handleAddRecommendationToCompare,
    comparisonBucketNames,
    addingRecommendations,
  };
};
