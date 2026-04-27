/**
 * External dependencies.
 */
import React, { useCallback, useMemo, useState } from "react";

/**
 * Internal dependencies.
 */
import { type PackageJsonDependencies } from "../../hooks/usePackageStats";
import { useDependencyStats } from "../../hooks/useDependencyStats";
import { Dashboard } from "./dashboard";
import { DependencySection } from "./dependencySection";
import { FilterPills } from "./filterPills";
import { computeFilterCounts, type ReportFilterKey } from "./reportFilters";

interface ReportTabProps {
  packageJsonDependencies: PackageJsonDependencies;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  packageJsonDependencies,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
}) => {
  const { statsByName, summary } = useDependencyStats(packageJsonDependencies);

  const [activeFilters, setActiveFilters] = useState<Set<ReportFilterKey>>(
    () => new Set(),
  );

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

  const toggleFilter = useCallback((key: ReportFilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
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
  const setFilterOn = useCallback((key: ReportFilterKey) => {
    setActiveFilters((prev) => {
      if (prev.has(key)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters((prev) => (prev.size === 0 ? prev : new Set()));
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
      />
      <DependencySection
        title="Dev Dependencies"
        packageNames={packageJsonDependencies.devDependencies}
        statsByName={statsByName}
        onAddRecommendationToCompare={onAddRecommendationToCompare}
        comparisonBucketNames={comparisonBucketNames}
        addingRecommendations={addingRecommendations}
        activeFilters={activeFilters}
      />
      <DependencySection
        title="Peer Dependencies"
        packageNames={packageJsonDependencies.peerDependencies}
        statsByName={statsByName}
        onAddRecommendationToCompare={onAddRecommendationToCompare}
        comparisonBucketNames={comparisonBucketNames}
        addingRecommendations={addingRecommendations}
        activeFilters={activeFilters}
      />
    </div>
  );
};
