/**
 * External dependencies.
 */
import { useState, type FC } from "react";
import type { ProjectFinding } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { CircularDependencyRow } from "./circularDependencyRow";
import { INITIAL_GROUP_LIMIT } from "./helpers";
import type { PostReveal } from "./types";

interface CircularDependencyListProps {
  findings: ProjectFinding[];
  postReveal: PostReveal;
}

/**
 * Paginated list of circular-dependency findings. Each row renders the
 * cycle file pills, an on-demand SVG diagram, and "Open file" actions.
 */
export const CircularDependencyList: FC<CircularDependencyListProps> = ({
  findings,
  postReveal,
}) => {
  const [showAll, setShowAll] = useState(false);
  const total = findings.length;
  const visible =
    showAll || total <= INITIAL_GROUP_LIMIT
      ? findings
      : findings.slice(0, INITIAL_GROUP_LIMIT);
  return (
    <div className="rounded border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
      <header className="flex items-center justify-end px-3 py-1.5 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {visible.length === total ? total : `${visible.length} of ${total}`}
        </span>
      </header>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {visible.map((finding, index) => (
          <CircularDependencyRow
            key={`${finding.code}-${index}`}
            finding={finding}
            postReveal={postReveal}
          />
        ))}
      </ul>
      {visible.length < total && (
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            type="button"
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
            onClick={() => setShowAll(true)}
          >
            Show all {total} cycles
          </button>
        </div>
      )}
    </div>
  );
};
