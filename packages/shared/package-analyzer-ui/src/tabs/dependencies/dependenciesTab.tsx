/**
 * External dependencies.
 */
import React, { useCallback, useMemo, useState } from "react";

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
}

export const DependenciesTab: React.FC<DependenciesTabProps> = ({
  packageJsonDependencies,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
  onRateLimited,
  onNavigateToComparison,
  hideCompare = false,
}) => {
  const { statsByName, summary } = useDependencyStats(packageJsonDependencies, {
    onRateLimited,
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
      />
    </div>
  );
};
