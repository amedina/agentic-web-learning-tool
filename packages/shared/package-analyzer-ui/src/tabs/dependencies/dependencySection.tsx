/**
 * External dependencies.
 */
import React, { useCallback, useMemo, useState } from "react";

/**
 * Internal dependencies.
 */
import { type DependencyStatsByName } from "../../hooks/useDependencyStats";
import { DependencyAccordionRow } from "./dependencyAccordionRow";
import {
  matchesFilters,
  type DependenciesFilterSet,
} from "./dependenciesFilters";

interface DependencySectionProps {
  title: string;
  packageNames: string[];
  statsByName: DependencyStatsByName;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
  activeFilters: DependenciesFilterSet;
  onNavigateToComparison?: () => void;
  /** Hide every Compare affordance inside the per-row insights bodies. */
  hideCompare?: boolean;
  /** Show the Fitness column inside the per-row insights bodies. */
  showFitness?: boolean;
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
  hideCompare = false,
  showFitness = false,
}) => {
  // Only one row per category stays expanded at a time. Tracking the open
  // package name here (rather than per-row) means opening a row collapses any
  // other open row in the same section, keeping the list from growing tall.
  const [openName, setOpenName] = useState<string | null>(null);

  const handleOpenChange = useCallback((name: string, isOpen: boolean) => {
    setOpenName(isOpen ? name : null);
  }, []);

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
            hideCompare={hideCompare}
            showFitness={showFitness}
            open={openName === name}
            onOpenChange={(isOpen) => handleOpenChange(name, isOpen)}
          />
        ))}
      </div>
    </div>
  );
};
