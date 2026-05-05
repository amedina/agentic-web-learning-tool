/**
 * External dependencies.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { type PackageJsonDependencies } from "../../types/statsClient";
import { useDependencyStats } from "../../hooks/useDependencyStats";
import { Dashboard } from "./dashboard";
import { DependencySection } from "./dependencySection";
import { FilterPills } from "./filterPills";
import {
  computeFilterCounts,
  type DependenciesFilterKey,
} from "./dependenciesFilters";

interface DependenciesTabProps {
  packageJsonDependencies: PackageJsonDependencies;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
  /** Called once when the first GitHub rate-limited result is detected. */
  onRateLimited?: () => void;
  /** Called to navigate to the comparison view. */
  onNavigateToComparison?: () => void;
  /**
   * Hide every Compare affordance inside the per-row insights bodies.
   * Set by consumers (e.g. the VSCode side panel) that don't ship a
   * comparison view.
   */
  hideCompare?: boolean;
  /**
   * Show the Fitness column inside each row's expanded insights body.
   * Defaults to false because the chrome extension's fetcher doesn't
   * load Responsiveness for dep rows; consumers whose fetcher returns
   * the full PackageStats can opt in.
   */
  showFitness?: boolean;
  /**
   * When set and changed, the tab clears any active filters before the
   * caller scrolls to / expands the named package's row. Without this
   * a "Show full insights" jump can land on a row that the current
   * filter set has hidden, leaving the user staring at a filtered list
   * that doesn't include their target.
   */
  forceVisiblePackageName?: string;
  /**
   * Pre-resolved PackageStats keyed by dep name, threaded through to
   * useDependencyStats so re-mounts (e.g. a VSCode webview reload on
   * panel visibility change) skip the per-dep fetch round-trip for
   * entries the host already has cached.
   */
  initialStatsByName?: Record<string, PackageStats | null>;
}

export const DependenciesTab: React.FC<DependenciesTabProps> = ({
  packageJsonDependencies,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
  onRateLimited,
  onNavigateToComparison,
  hideCompare = false,
  showFitness = false,
  forceVisiblePackageName,
  initialStatsByName,
}) => {
  const { statsByName, summary } = useDependencyStats(packageJsonDependencies, {
    onRateLimited,
    initialStatsByName,
  });

  const [activeFilters, setActiveFilters] = useState<
    Set<DependenciesFilterKey>
  >(() => new Set());

  const allPackageNames = useMemo(
    () => [
      ...packageJsonDependencies.dependencies,
      ...packageJsonDependencies.devDependencies,
      ...packageJsonDependencies.peerDependencies,
    ],
    [packageJsonDependencies],
  );

  const counts = useMemo(
    () => computeFilterCounts(allPackageNames, statsByName),
    [allPackageNames, statsByName],
  );

  const toggleFilter = useCallback((key: DependenciesFilterKey) => {
    setActiveFilters((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Matrix tiles act as set-on triggers (additive). Clicking the same tile
  // twice keeps the filter on — use the pill's X to remove it.
  const setFilterOn = useCallback((key: DependenciesFilterKey) => {
    setActiveFilters((previous) => {
      if (previous.has(key)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(key);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters((previous) =>
      previous.size === 0 ? previous : new Set(),
    );
  }, []);

  // Drop active filters whenever an external "force visible" target
  // changes, so a "Show full insights" jump from elsewhere in the host
  // (e.g. a VSCode hover popover link) never lands on a row the user
  // has filtered out of view.
  useEffect(() => {
    if (forceVisiblePackageName) {
      clearFilters();
    }
  }, [forceVisiblePackageName, clearFilters]);

  return (
    <div className="text-slate-800 dark:text-slate-200 p-4 space-y-4 h-full overflow-y-auto">
      <Dashboard
        statsByName={statsByName}
        packageJsonDependencies={packageJsonDependencies}
        summary={summary}
        onSetFilter={setFilterOn}
        onClearFilters={clearFilters}
      />
      <FilterPills
        activeFilters={activeFilters}
        counts={counts}
        onToggle={toggleFilter}
        onClear={clearFilters}
      />
      <DependencySection
        title="Dependencies"
        packageNames={packageJsonDependencies.dependencies}
        statsByName={statsByName}
        onAddRecommendationToCompare={onAddRecommendationToCompare}
        comparisonBucketNames={comparisonBucketNames}
        addingRecommendations={addingRecommendations}
        activeFilters={activeFilters}
        onNavigateToComparison={onNavigateToComparison}
        hideCompare={hideCompare}
        showFitness={showFitness}
      />
      <DependencySection
        title="Dev Dependencies"
        packageNames={packageJsonDependencies.devDependencies}
        statsByName={statsByName}
        onAddRecommendationToCompare={onAddRecommendationToCompare}
        comparisonBucketNames={comparisonBucketNames}
        addingRecommendations={addingRecommendations}
        activeFilters={activeFilters}
        onNavigateToComparison={onNavigateToComparison}
        hideCompare={hideCompare}
        showFitness={showFitness}
      />
      <DependencySection
        title="Peer Dependencies"
        packageNames={packageJsonDependencies.peerDependencies}
        statsByName={statsByName}
        onAddRecommendationToCompare={onAddRecommendationToCompare}
        comparisonBucketNames={comparisonBucketNames}
        addingRecommendations={addingRecommendations}
        activeFilters={activeFilters}
        onNavigateToComparison={onNavigateToComparison}
        hideCompare={hideCompare}
        showFitness={showFitness}
      />
    </div>
  );
};
