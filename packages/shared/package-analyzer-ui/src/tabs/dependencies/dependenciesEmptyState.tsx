/**
 * External dependencies.
 */
import React from "react";
import { FilterX } from "lucide-react";

interface DependenciesEmptyStateProps {
  /** Clears every active filter so the full dependency list returns. */
  onClearFilters: () => void;
}

/**
 * Shown in the accordion area when an active filter combination matches no
 * packages. Reserves a minimum height so the filter pills above don't end up
 * flush against the bottom of an otherwise empty panel.
 */
export const DependenciesEmptyState: React.FC<DependenciesEmptyStateProps> = ({
  onClearFilters,
}) => {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-6 py-10 text-center">
      <FilterX
        size={28}
        className="text-slate-400 dark:text-slate-500"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          No dependencies match the selected filters
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Try removing a filter to widen the results.
        </p>
      </div>
      <button
        type="button"
        onClick={onClearFilters}
        className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
      >
        Clear filters
      </button>
    </div>
  );
};
