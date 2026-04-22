/**
 * External dependencies
 */
import React from "react";

/**
 * Internal dependencies
 */
import type { SearchFilters } from "../../types";

interface FilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: (
    key: keyof SearchFilters,
    value: SearchFilters[keyof SearchFilters],
  ) => void;
  onClear: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onClear,
}) => {
  return (
    <div className="w-[280px] shrink-0 flex flex-col gap-8 p-8 h-full">
      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
          Filters
        </h2>
        <button
          onClick={onClear}
          className="text-xs text-orange-600 hover:text-orange-700 font-bold hover:underline underline-offset-4"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-8 px-1">
        <div>
          <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.15em] mb-5 flex items-center gap-3">
            <span className="shrink-0">Server-side Filters</span>
            <div className="h-[1px] w-full bg-zinc-100 dark:bg-zinc-800/50" />
          </h3>

          <div className="flex flex-col gap-6">
            {/* Downloads Filter */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                Popularity
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "> 1M monthly", value: 1000000 },
                  { label: "> 100k monthly", value: 100000 },
                  { label: "> 10k monthly", value: 10000 },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center gap-2.5 text-sm cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.minDownloads === item.value}
                      onChange={() =>
                        onFilterChange(
                          "minDownloads",
                          filters.minDownloads === item.value
                            ? null
                            : item.value,
                        )
                      }
                      className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-orange-600 focus:ring-orange-500 bg-transparent"
                    />
                    <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recency Filter */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                Updates
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Last 30 days", value: 30 },
                  { label: "Last 90 days", value: 90 },
                  { label: "Last year", value: 365 },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center gap-2.5 text-sm cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.lastUpdated === item.value}
                      onChange={() =>
                        onFilterChange(
                          "lastUpdated",
                          filters.lastUpdated === item.value
                            ? null
                            : item.value,
                        )
                      }
                      className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-orange-600 focus:ring-orange-500 bg-transparent"
                    />
                    <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 font-medium">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ecosystem Filter */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                Ecosystem
              </h3>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.notDeprecated}
                    onChange={() =>
                      onFilterChange("notDeprecated", !filters.notDeprecated)
                    }
                    className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-orange-600 focus:ring-orange-500 bg-transparent"
                  />
                  <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 font-medium">
                    Not Deprecated
                  </span>
                </label>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.hasTypes}
                    onChange={() =>
                      onFilterChange("hasTypes", !filters.hasTypes)
                    }
                    className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-orange-600 focus:ring-orange-500 bg-transparent"
                  />
                  <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 font-medium">
                    TypeScript
                  </span>
                </label>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.moduleEsm}
                    onChange={() =>
                      onFilterChange("moduleEsm", !filters.moduleEsm)
                    }
                    className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-orange-600 focus:ring-orange-500 bg-transparent"
                  />
                  <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 font-medium">
                    ES Modules
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-[10px] font-black uppercase text-orange-500 tracking-[0.15em] mb-4 flex items-center gap-3">
            <span className="shrink-0">Client-side Filters</span>
            <div className="h-[1px] w-full bg-orange-100 dark:bg-orange-500/20" />
          </h3>
          <p className="text-[10px] text-zinc-400 leading-relaxed mb-5 font-medium italic">
            Scanning top 500 packages locally.
          </p>

          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.licenseMit}
                onChange={() =>
                  onFilterChange("licenseMit", !filters.licenseMit)
                }
                className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-orange-600 focus:ring-orange-500 bg-transparent"
              />
              <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 font-medium">
                MIT License
              </span>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.hasHomepage}
                onChange={() =>
                  onFilterChange("hasHomepage", !filters.hasHomepage)
                }
                className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-orange-600 focus:ring-orange-500 bg-transparent"
              />
              <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 font-medium">
                Homepage / Docs
              </span>
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.hasRepo}
                onChange={() => onFilterChange("hasRepo", !filters.hasRepo)}
                className="w-4 h-4 rounded-sm border-zinc-300 dark:border-zinc-700 text-orange-600 focus:ring-orange-500 bg-transparent"
              />
              <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 font-medium">
                Public Repository
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
