/**
 * External dependencies.
 */
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../lib";
import { type PackageJsonDependencies } from "./usePackageStats";

export type DependencyStatsState =
  | { status: "pending" }
  | { status: "loading" }
  | { status: "loaded"; stats: PackageStats }
  | { status: "not_found" }
  | { status: "error"; error: string };

export interface DependencyStatsByName {
  [packageName: string]: DependencyStatsState;
}

const CONCURRENCY = 3;

// Cross-render cache keyed by the flat list of package names. Keeps state
// stable when the Report tab unmounts/remounts (e.g. user switches tabs).
const dependencyStatsCache = new Map<string, DependencyStatsState>();

const fetchLightStats = (packageName: string): Promise<DependencyStatsState> =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "GET_LIGHT_STATS", packageName },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            status: "error",
            error:
              chrome.runtime.lastError.message ||
              "Failed to reach background script.",
          });
          return;
        }
        if (response?.success) {
          if (response.data) {
            resolve({ status: "loaded", stats: response.data });
          } else {
            resolve({ status: "not_found" });
          }
          return;
        }
        resolve({
          status: "error",
          error: response?.error || "Failed to load package stats.",
        });
      },
    );
  });

/**
 * Fetches lightweight stats (no dependency tree) for every package declared
 * in the three dep lists of a package.json, with a small concurrency pool so
 * we don't saturate GitHub/npm rate limits.
 */
export const useDependencyStats = (
  packageJsonDependencies: PackageJsonDependencies | null,
) => {
  const allPackageNames = useMemo(() => {
    if (!packageJsonDependencies) return [] as string[];
    const unique = new Set<string>([
      ...packageJsonDependencies.dependencies,
      ...packageJsonDependencies.devDependencies,
      ...packageJsonDependencies.peerDependencies,
    ]);
    return Array.from(unique);
  }, [packageJsonDependencies]);

  const [statsByName, setStatsByName] = useState<DependencyStatsByName>(() => {
    const initial: DependencyStatsByName = {};
    for (const name of allPackageNames) {
      initial[name] = dependencyStatsCache.get(name) ?? { status: "pending" };
    }
    return initial;
  });

  // Guards against stale updates if the hook is re-run (e.g. URL changes)
  // while prior fetches are still in flight.
  const runIdRef = useRef(0);

  useEffect(() => {
    if (allPackageNames.length === 0) {
      setStatsByName({});
      return;
    }

    const runId = ++runIdRef.current;

    const initial: DependencyStatsByName = {};
    const queue: string[] = [];
    for (const name of allPackageNames) {
      const cached = dependencyStatsCache.get(name);
      if (cached && cached.status !== "pending") {
        initial[name] = cached;
      } else {
        initial[name] = { status: "pending" };
        queue.push(name);
      }
    }
    setStatsByName(initial);

    if (queue.length === 0) return;

    let queueIndex = 0;

    const runWorker = async () => {
      while (true) {
        const currentIndex = queueIndex++;
        if (currentIndex >= queue.length) return;
        if (runId !== runIdRef.current) return;

        const packageName = queue[currentIndex];

        setStatsByName((previous) => ({
          ...previous,
          [packageName]: { status: "loading" },
        }));

        const result = await fetchLightStats(packageName);

        dependencyStatsCache.set(packageName, result);

        if (runId !== runIdRef.current) return;

        setStatsByName((previous) => ({
          ...previous,
          [packageName]: result,
        }));
      }
    };

    const workerCount = Math.min(CONCURRENCY, queue.length);
    for (let i = 0; i < workerCount; i++) {
      void runWorker();
    }
  }, [allPackageNames]);

  const summary = useMemo(() => {
    const entries = Object.values(statsByName);
    const total = entries.length;
    const loaded = entries.filter((entry) => entry.status === "loaded").length;
    const notFound = entries.filter(
      (entry) => entry.status === "not_found",
    ).length;
    const errored = entries.filter((entry) => entry.status === "error").length;
    const pendingOrLoading = total - loaded - notFound - errored;
    const isComplete = total > 0 && pendingOrLoading === 0;
    return {
      total,
      loaded,
      notFound,
      errored,
      pendingOrLoading,
      isComplete,
    };
  }, [statsByName]);

  return {
    statsByName,
    summary,
  };
};
