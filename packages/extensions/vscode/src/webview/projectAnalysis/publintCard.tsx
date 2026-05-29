/**
 * External dependencies.
 */
import { useMemo, useState, type FC } from "react";
import { ShieldCheck } from "lucide-react";
import type { ProjectFinding } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { CollapsibleCard } from "./collapsibleCard";
import { FindingList } from "./findingList";
import { filterFindings, summariseSeverity } from "./helpers";
import { SeverityFilterBar } from "./severityFilterBar";
import type { FilterState, PostReveal } from "./types";

interface PublintCardProps {
  findings: ProjectFinding[];
  postReveal: PostReveal;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Collapsible card containing publint (publishing-readiness) findings,
 * a severity filter bar, and a paginated list. Default state is
 * collapsed; the parent decides when it's open.
 */
export const PublintCard: FC<PublintCardProps> = ({
  findings,
  postReveal,
  expanded,
  onToggle,
}) => {
  const summary = useMemo(() => summariseSeverity(findings), [findings]);
  const [filters, setFilters] = useState<FilterState>({
    severity: "all",
    query: "",
  });

  const filtered = useMemo(
    () => filterFindings(findings, filters),
    [findings, filters],
  );
  const isFiltered = filters.severity !== "all" || filters.query.trim() !== "";

  return (
    <CollapsibleCard
      title="Publishing hygiene"
      subtitle={
        <span>
          powered by{" "}
          <a
            href="https://publint.dev"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            publint
          </a>
        </span>
      }
      icon={<ShieldCheck size={14} />}
      badge={findings.length}
      badgeTone={findings.length > 0 ? "warning" : "ok"}
      collapsed={!expanded}
      onToggle={onToggle}
    >
      {findings.length === 0 ? (
        <div className="px-3 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck size={14} />
          No publishing-readiness issues found.
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-3 py-3">
          <SeverityFilterBar
            summary={summary}
            filters={filters}
            onChange={setFilters}
            filteredCount={filtered.length}
            isFiltered={isFiltered}
          />
          {filtered.length === 0 ? (
            <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-500 dark:text-slate-400">
              No findings match the active filters.{" "}
              <button
                type="button"
                className="underline-offset-2 hover:underline text-slate-700 dark:text-slate-200"
                onClick={() => setFilters({ severity: "all", query: "" })}
              >
                Clear filters
              </button>
              .
            </div>
          ) : (
            <FindingList findings={filtered} postReveal={postReveal} />
          )}
        </div>
      )}
    </CollapsibleCard>
  );
};
