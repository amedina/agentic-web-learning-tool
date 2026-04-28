/**
 * External dependencies.
 */
import React, { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { type DependencyStatsByName } from "../../hooks/useDependencyStats";
import { DependencyAccordionRow } from "./dependencyAccordionRow";
import { matchesFilters, type ReportFilterSet } from "./reportFilters";

interface DependencySectionProps {
  title: string;
  packageNames: string[];
  statsByName: DependencyStatsByName;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
  activeFilters: ReportFilterSet;
  onNavigateToComparison?: () => void;
}

export const DependencySection: React.FC<DependencySectionProps> = ({
  title,
  packageNames,
  statsByName,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
  activeFilters,
  onNavigateToComparison,
}) => {
  const visibleNames = useMemo(
    () =>
      packageNames.filter((name) =>
        matchesFilters(statsByName[name], activeFilters),
      ),
    [packageNames, statsByName, activeFilters],
  );

  if (packageNames.length === 0 || visibleNames.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {title}
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {activeFilters.size > 0
            ? `${visibleNames.length} / ${packageNames.length}`
            : packageNames.length}
        </span>
      </div>
      <div>
        {visibleNames.map((name) => (
          <DependencyAccordionRow
            key={name}
            packageName={name}
            state={statsByName[name] ?? { status: "pending" }}
            onAddRecommendationToCompare={onAddRecommendationToCompare}
            comparisonBucketNames={comparisonBucketNames}
            addingRecommendations={addingRecommendations}
            onNavigateToComparison={onNavigateToComparison}
          />
        ))}
      </div>
    </div>
  );
};
