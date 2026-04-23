/**
 * External dependencies.
 */
import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@google-awlt/design-system";
import { ChevronDown, Loader2, ShieldAlert } from "lucide-react";

/**
 * Internal dependencies.
 */
import { type DependencyStatsState } from "../../hooks/useDependencyStats";
import { PackageInsightsBody } from "../insights/packageInsightsBody";

interface DependencyAccordionRowProps {
  packageName: string;
  state: DependencyStatsState;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

const StatusSummary: React.FC<{ state: DependencyStatsState }> = ({
  state,
}) => {
  if (state.status === "pending" || state.status === "loading") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 size={12} className="animate-spin" />
        Loading
      </span>
    );
  }

  if (state.status === "not_found") {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Not on npmjs.com
      </span>
    );
  }

  if (state.status === "error") {
    return (
      <span className="text-xs text-red-600 dark:text-red-400">Error</span>
    );
  }

  const stats = state.stats;
  const vulnerabilityCount = stats.securityAdvisories?.issues?.length ?? 0;
  const score = stats.score;

  return (
    <div className="flex items-center gap-2">
      {vulnerabilityCount > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-semibold">
          <ShieldAlert size={10} />
          {vulnerabilityCount}
        </span>
      )}
      <span
        className="inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold"
        title="Package score"
      >
        {score}
      </span>
    </div>
  );
};

export const DependencyAccordionRow: React.FC<DependencyAccordionRowProps> = ({
  packageName,
  state,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-b border-slate-200 dark:border-slate-700 last:border-b-0"
    >
      <CollapsibleTrigger className="group w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors outline-none">
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown
            size={14}
            className="shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180"
          />
          <span
            className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate"
            title={packageName}
          >
            {packageName}
          </span>
        </div>
        <StatusSummary state={state} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 pt-1">
        {state.status === "loaded" ? (
          <PackageInsightsBody
            stats={state.stats}
            onAddRecommendationToCompare={onAddRecommendationToCompare}
            comparisonBucketNames={comparisonBucketNames}
            addingRecommendations={addingRecommendations}
            showDependencyTree={false}
          />
        ) : state.status === "not_found" ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            This package was not found on npmjs.com. It may not be published.
          </p>
        ) : state.status === "error" ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-2">
            <Loader2 size={12} className="animate-spin" />
            Fetching stats…
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
