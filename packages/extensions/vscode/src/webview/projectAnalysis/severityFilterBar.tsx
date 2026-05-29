/**
 * External dependencies.
 */
import { useCallback, type FC } from "react";
import { Search, X } from "lucide-react";

/**
 * Internal dependencies.
 */
import { FilterChip } from "./filterChip";
import type { FilterState, PublintSummary, SeverityFilter } from "./types";

interface SeverityFilterBarProps {
  summary: PublintSummary;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  filteredCount: number;
  isFiltered: boolean;
}

/**
 * Combined summary + filter bar for publint. Severity counts double as
 * toggleable filter chips: clicking "5 errors" narrows the list to
 * errors; clicking the active chip (or "total") clears the severity
 * filter. A free-text search input sits below.
 */
export const SeverityFilterBar: FC<SeverityFilterBarProps> = ({
  summary,
  filters,
  onChange,
  filteredCount,
  isFiltered,
}) => {
  const toggleSeverity = useCallback(
    (next: SeverityFilter) => {
      onChange({
        ...filters,
        severity: filters.severity === next ? "all" : next,
      });
    },
    [filters, onChange],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <FilterChip
          label={`${summary.total} total`}
          tone="neutral"
          isActive={filters.severity === "all"}
          onClick={() => onChange({ ...filters, severity: "all" })}
        />
        {summary.bySeverity.error > 0 && (
          <FilterChip
            label={`${summary.bySeverity.error} errors`}
            tone="error"
            isActive={filters.severity === "error"}
            onClick={() => toggleSeverity("error")}
          />
        )}
        {summary.bySeverity.warning > 0 && (
          <FilterChip
            label={`${summary.bySeverity.warning} warnings`}
            tone="warning"
            isActive={filters.severity === "warning"}
            onClick={() => toggleSeverity("warning")}
          />
        )}
        {summary.bySeverity.info > 0 && (
          <FilterChip
            label={`${summary.bySeverity.info} info`}
            tone="info"
            isActive={filters.severity === "info"}
            onClick={() => toggleSeverity("info")}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={filters.query}
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
            placeholder="Filter by rule code, file, message…"
            className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
        {isFiltered && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => onChange({ severity: "all", query: "" })}
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
      {isFiltered && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing {filteredCount} of {summary.total}.
        </div>
      )}
    </div>
  );
};
