/**
 * External dependencies.
 */
import React from "react";
import { X } from "lucide-react";

/**
 * Internal dependencies.
 */
import { REPORT_COLORS } from "./reportColors";
import {
  type ReportFilterKey,
  type ReportFilterSet,
  type ReportFilterCounts,
} from "./reportFilters";

interface FilterPillsProps {
  activeFilters: ReportFilterSet;
  counts: ReportFilterCounts;
  onToggle: (key: ReportFilterKey) => void;
  onClear: () => void;
}

interface PillSpec {
  key: ReportFilterKey;
  label: string;
  color: string;
  count: number;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  activeFilters,
  counts,
  onToggle,
  onClear,
}) => {
  const isAllActive = activeFilters.size === 0;

  // Hide zero-count pills unless they're currently active. Keeping an
  // active pill visible prevents it from disappearing mid-interaction (the
  // count can drop to 0 once the filter is applied to a partially-loaded
  // dataset), which would strand the user with an active filter and no way
  // to remove it.
  const pills: PillSpec[] = [
    {
      key: "withIssues",
      label: "With Issues",
      color: "#1e293b",
      count: counts.withIssues,
    },
    {
      key: "vulnerable",
      label: "Vulnerabilities",
      color: REPORT_COLORS.vulnerable,
      count: counts.vulnerable,
    },
    {
      key: "licenseIssue",
      label: "License Issues",
      color: REPORT_COLORS.licenseIssue,
      count: counts.licenseIssue,
    },
    {
      key: "replaceable",
      label: "Replaceable",
      color: REPORT_COLORS.replaceable,
      count: counts.replaceable,
    },
  ].filter((pill) => pill.count > 0 || activeFilters.has(pill.key));

  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap -mx-4 px-4 pb-1 [scrollbar-width:thin]">
      <button
        type="button"
        onClick={onClear}
        aria-pressed={isAllActive}
        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
          isAllActive
            ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
        }`}
      >
        <span>All</span>
        <span className="tabular-nums opacity-80">{counts.total}</span>
        {isAllActive && activeFilters.size === 0 ? null : null}
      </button>
      {pills.map((pill) => {
        const isActive = activeFilters.has(pill.key);
        return (
          <button
            key={pill.key}
            type="button"
            onClick={() => onToggle(pill.key)}
            aria-pressed={isActive}
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
              isActive
                ? "border-transparent text-white"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
            style={isActive ? { backgroundColor: pill.color } : undefined}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: pill.color }}
            />
            <span>{pill.label}</span>
            <span className="tabular-nums opacity-80">{pill.count}</span>
            {isActive && (
              <X
                size={11}
                className="ml-0.5 opacity-90"
                aria-label={`Remove ${pill.label} filter`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
