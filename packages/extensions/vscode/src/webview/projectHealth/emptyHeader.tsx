/**
 * External dependencies.
 */
import { type FC } from "react";
import { PlayCircle, ShieldCheck } from "lucide-react";

interface EmptyHeaderProps {
  /** Which sub-tab this empty state belongs to, tuning the copy + button. */
  scope: "dependencies" | "project";
  /** Kick off the run for this sub-tab's scope. */
  onRun: () => void;
}

/**
 * Empty state shown before the first run of a sub-tab: a short
 * explanatory line and a primary button that kicks off the matching
 * scope. The Dependencies tab runs the fast vulnerability + license
 * check; the Project Analysis tab runs the slower publint + circular +
 * replacement pass.
 */
export const EmptyHeader: FC<EmptyHeaderProps> = ({ scope, onRun }) => {
  const isDependencies = scope === "dependencies";
  const explanation = isDependencies
    ? "Checks every package.json in the workspace for dependency vulnerabilities and license issues. This is the fast pass."
    : "Analyzes every package.json for publishing (publint) problems, circular dependencies, and replacement suggestions. This is the slower pass.";
  const buttonLabel = isDependencies
    ? "Run dependency check"
    : "Run project analysis";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
        <ShieldCheck
          size={16}
          className="shrink-0 mt-0.5 text-slate-400 dark:text-slate-500"
        />
        <p>{explanation}</p>
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-1.5 rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
        onClick={onRun}
      >
        <PlayCircle size={14} />
        {buttonLabel}
      </button>
    </div>
  );
};
