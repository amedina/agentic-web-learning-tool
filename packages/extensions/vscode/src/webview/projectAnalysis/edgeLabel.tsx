/**
 * External dependencies.
 */
import { type FC } from "react";
import { ArrowDown } from "lucide-react";

/**
 * Internal dependencies.
 */
import { summariseSymbols } from "./helpers";
import type { CycleEdge } from "./types";

interface EdgeLabelProps {
  edge: CycleEdge | undefined;
  /** "inline" sits next to a pill chain; "block" stacks under a file row. */
  variant: "inline" | "block";
}

/**
 * Renders the symbols imported across one cycle edge. Falls back to a
 * plain "imports" arrow when the analyzer couldn't resolve the import
 * (e.g. the importer uses a path alias the resolver doesn't know
 * about, or the edge goes through a re-export chain).
 */
export const EdgeLabel: FC<EdgeLabelProps> = ({ edge, variant }) => {
  const symbols = edge?.symbols ?? [];
  const hasSymbols = symbols.length > 0;
  const isTypeOnly = edge?.isTypeOnly ?? false;
  const isSideEffect = edge?.isSideEffectOnly ?? false;

  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-1 shrink-0 text-slate-400 dark:text-slate-500 max-w-full min-w-0">
        <span className="shrink-0">→</span>
        {hasSymbols ? (
          <span
            className="font-mono text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 break-all max-w-[180px] truncate"
            title={summariseSymbols(symbols, isTypeOnly, isSideEffect, false)}
          >
            {summariseSymbols(symbols, isTypeOnly, isSideEffect, true)}
          </span>
        ) : isSideEffect ? (
          <span className="text-[10px] italic text-slate-500">side-effect</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pl-1 text-amber-700 dark:text-amber-300">
      <ArrowDown size={12} className="shrink-0" />
      <span className="text-[10px] italic text-slate-500 dark:text-slate-400 shrink-0">
        imports
      </span>
      {hasSymbols && (
        <span
          className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 break-all"
          title={summariseSymbols(symbols, isTypeOnly, isSideEffect, false)}
        >
          {isTypeOnly && (
            <span className="text-sky-700 dark:text-sky-400 mr-1">type</span>
          )}
          {summariseSymbols(symbols, false, false, false)}
        </span>
      )}
      {!hasSymbols && isSideEffect && (
        <span className="text-[10px] italic text-slate-500 dark:text-slate-400">
          for side-effects
        </span>
      )}
    </div>
  );
};
