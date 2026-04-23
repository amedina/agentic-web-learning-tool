/**
 * External dependencies
 */
import React from "react";
import { BarChart2, ExternalLink, SlidersHorizontal } from "lucide-react";

/**
 * Internal dependencies
 */
import type { SearchFilters } from "../../types";

interface ResultsHeaderProps {
  query: string;
  hitsCount: number;
  nbHits: number;
  isClientSideMode: boolean;
  filters: SearchFilters;
  sortOrder: "asc" | "desc";
  comparisonBucket: Record<string, unknown>[];
  onFilterChange: (
    key: keyof SearchFilters,
    value: SearchFilters[keyof SearchFilters],
  ) => void;
  onSortOrderToggle: () => void;
  onOpenFilters: () => void;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  query,
  hitsCount,
  nbHits,
  isClientSideMode,
  filters,
  sortOrder,
  comparisonBucket,
  onFilterChange,
  onSortOrderToggle,
  onOpenFilters,
}) => {
  return (
    <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm top-0 shrink-0 lg:w-5xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenFilters}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-zinc-200 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <SlidersHorizontal size={14} />
            Filters
          </button>
          <h1 className="text-lg font-bold hidden lg:block">
            {isClientSideMode
              ? `Showing top ${hitsCount} sorted results for `
              : `${nbHits.toLocaleString()} results for `}
            <span className="italic text-orange-600">"{query}"</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {comparisonBucket.length > 0 && (
            <button
              onClick={() =>
                chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" })
              }
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 rounded border border-zinc-200 dark:border-zinc-800 transition-all font-bold text-xs mr-2 shadow-sm"
              title="View Comparison"
            >
              <BarChart2 size={16} />
              <span>View Comparison ({comparisonBucket.length})</span>
              <ExternalLink size={12} />
            </button>
          )}
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-tighter">
            Sort by:
          </span>
          <div className="flex items-center gap-1">
            <select
              value={filters.ranking}
              onChange={(event) =>
                onFilterChange("ranking", event.target.value)
              }
              className="text-xs font-bold bg-zinc-200 dark:bg-zinc-900 border-none rounded px-3 py-1.5 focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer text-center"
            >
              <option value="optimal">Relevance</option>
              <option value="popularity">Popularity</option>
              <option value="maintenance">Maintenance</option>
              <option value="advisor">Advisor Score</option>
            </select>

            {filters.ranking !== "optimal" && (
              <button
                onClick={onSortOrderToggle}
                className="p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title={`Currently sorting ${sortOrder === "desc" ? "Descending" : "Ascending"}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={
                    sortOrder === "asc"
                      ? "rotate-180 transition-transform"
                      : "transition-transform"
                  }
                >
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      <h1 className="text-lg font-bold lg:hidden mt-5">
        {isClientSideMode
          ? `Showing top ${hitsCount} sorted results for `
          : `${nbHits.toLocaleString()} results for `}
        <span className="italic text-orange-600">"{query}"</span>
      </h1>
    </div>
  );
};
