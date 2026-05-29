/**
 * External dependencies.
 */
import { useMemo, useState, type FC } from "react";
import { Repeat, Search, ShieldCheck, X } from "lucide-react";
import type { ProjectFinding } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { CircularDependencyList } from "./circularDependencyList";
import { CollapsibleCard } from "./collapsibleCard";
import type { PostReveal } from "./types";

interface CircularDependenciesCardProps {
  findings: ProjectFinding[];
  postReveal: PostReveal;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Collapsible card containing circular-dependency findings. Each
 * finding is a single cycle, rendered with a chain of clickable file
 * pills plus an on-demand SVG cycle diagram. Includes a free-text
 * filter that matches against file paths.
 */
export const CircularDependenciesCard: FC<CircularDependenciesCardProps> = ({
  findings,
  postReveal,
  expanded,
  onToggle,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return findings;
    }
    return findings.filter((finding) => {
      const haystack = [
        finding.message,
        finding.file ?? "",
        ...((finding.data?.cycleRelative as string[] | undefined) ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [findings, query]);

  return (
    <CollapsibleCard
      title="Circular dependencies"
      subtitle={
        <span>
          powered by{" "}
          <a
            href="https://github.com/pahen/madge"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            madge
          </a>
        </span>
      }
      icon={<Repeat size={14} />}
      badge={findings.length}
      badgeTone={findings.length > 0 ? "warning" : "ok"}
      collapsed={!expanded}
      onToggle={onToggle}
    >
      {findings.length === 0 ? (
        <div className="px-3 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck size={14} />
          No circular dependencies detected in your source tree.
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-3 py-3">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter cycles by file path…"
              className="w-full pl-7 pr-7 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
            {query.trim() !== "" && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {query.trim() !== "" && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filtered.length} of {findings.length}.
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-500 dark:text-slate-400">
              No cycles match the filter.
            </div>
          ) : (
            <CircularDependencyList
              findings={filtered}
              postReveal={postReveal}
            />
          )}
        </div>
      )}
    </CollapsibleCard>
  );
};
