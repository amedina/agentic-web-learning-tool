/**
 * External dependencies.
 */
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Internal dependencies.
 */
import { type DependencyCategory, type PackageStats } from "../../../lib";
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

// Cross-render cache keyed by `${packageName}::${category}` so the same
// package scored as a runtime dep in one project and a dev dep in another
// keeps independent entries (scoring rules differ per category).
const dependencyStatsCache = new Map<string, DependencyStatsState>();

const cacheKey = (packageName: string, category: DependencyCategory) =>
  `${packageName}::${category}`;

const fetchLightStats = (
  packageName: string,
  dependencyCategory: DependencyCategory,
): Promise<DependencyStatsState> =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "GET_LIGHT_STATS", packageName, dependencyCategory },
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
interface DependencyEntry {
  name: string;
  category: DependencyCategory;
}

export const useDependencyStats = (
  packageJsonDependencies: PackageJsonDependencies | null,
) => {
  // Resolve each package to a single category for scoring. A package listed
  // in multiple sections (rare but legal) is treated as runtime if it
  // appears under dependencies or peerDependencies, otherwise dev — so we
  // never score it with the stricter "dev" rules if it also ships.
  const dependencyEntries = useMemo<DependencyEntry[]>(() => {
    if (!packageJsonDependencies) return [];
    const byName = new Map<string, DependencyCategory>();
    for (const name of packageJsonDependencies.devDependencies) {
      byName.set(name, "dev");
    }
    for (const name of packageJsonDependencies.peerDependencies) {
      byName.set(name, "runtime");
    }
    for (const name of packageJsonDependencies.dependencies) {
      byName.set(name, "runtime");
    }
    return Array.from(byName, ([name, category]) => ({ name, category }));
  }, [packageJsonDependencies]);

  const [statsByName, setStatsByName] = useState<DependencyStatsByName>(() => {
    const initial: DependencyStatsByName = {};
    for (const entry of dependencyEntries) {
      initial[entry.name] = dependencyStatsCache.get(
        cacheKey(entry.name, entry.category),
      ) ?? {
        status: "pending",
      };
    }
    return initial;
  });

  // Guards against stale updates if the hook is re-run (e.g. URL changes)
  // while prior fetches are still in flight.
  const runIdRef = useRef(0);

  useEffect(() => {
    if (dependencyEntries.length === 0) {
      setStatsByName({});
      return;
    }

    const runId = ++runIdRef.current;

    const initial: DependencyStatsByName = {};
    const queue: DependencyEntry[] = [];
    for (const entry of dependencyEntries) {
      const cached = dependencyStatsCache.get(
        cacheKey(entry.name, entry.category),
      );
      if (cached && cached.status !== "pending") {
        initial[entry.name] = cached;
      } else {
        initial[entry.name] = { status: "pending" };
        queue.push(entry);
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

        const { name, category } = queue[currentIndex];

        setStatsByName((previous) => ({
          ...previous,
          [name]: { status: "loading" },
        }));

        const result = await fetchLightStats(name, category);

        dependencyStatsCache.set(cacheKey(name, category), result);

        if (runId !== runIdRef.current) return;

        setStatsByName((previous) => ({
          ...previous,
          [name]: result,
        }));
      }
    };

    const workerCount = Math.min(CONCURRENCY, queue.length);
    for (let i = 0; i < workerCount; i++) {
      void runWorker();
    }
  }, [dependencyEntries]);

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
