/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../utils";

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
        setLoading(true);
        setError(null);

        // 1. Query chrome active tab
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tab?.url;

        if (!url) {
          throw new Error("Could not determine current tab URL.");
        }

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
          throw new Error(
            "Navigate to an NPM package or a GitHub package.json page to view stats.",
          );
        }

        // Ask background script for the cached stats payload
        chrome.runtime.sendMessage(
          { type: "GET_STATS", packageName },
          (response) => {
            if (chrome.runtime.lastError) {
              setLoading(false);
              return setError(
                chrome.runtime.lastError.message ||
                  "Failed to communicate with background script.",
              );
            }
            if (response && response.success) {
              if (response.data) {
                setStats(response.data);
              } else {
                setError("Failed to load statistics for this package.");
              }
            } else {
              setError(
                response?.error ||
                  "Failed to load statistics for this package.",
              );
            }
            setLoading(false);
          },
        );
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
        setLoading(false);
      }
    };

    fetchCurrentTabStats();

    chrome.webNavigation.onCompleted.addListener(async (details) => {
      const currentTabId = Number(window.location.hash.slice(5));
      if (details.frameId !== 0 || details.tabId !== currentTabId) {
        return;
      }

      fetchCurrentTabStats();
    });

    return () => {
      chrome.webNavigation.onCompleted.removeListener(async (details) => {
        const currentTabId = Number(window.location.hash.slice(5));
        if (details.frameId !== 0 || details.tabId !== currentTabId) {
          return;
        }

        fetchCurrentTabStats();
      });
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
