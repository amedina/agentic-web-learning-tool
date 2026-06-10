/**
 * External dependencies.
 */
import { type FC } from "react";
import { PlayCircle, ShieldCheck } from "lucide-react";

interface EmptyHeaderProps {
  onRun: () => void;
}

/**
 * Empty state shown before the first run: a short explanatory line and
 * a primary button that kicks off a full workspace analysis.
 */
export const EmptyHeader: FC<EmptyHeaderProps> = ({ onRun }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
        <ShieldCheck
          size={16}
          className="shrink-0 mt-0.5 text-slate-400 dark:text-slate-500"
        />
        <p>
          Analyzes every package.json in the workspace for vulnerabilities,
          license issues, and publishing problems.
        </p>
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center gap-1.5 rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
        onClick={onRun}
      >
        <PlayCircle size={14} />
        Run full project analysis
      </button>
    </div>
  );
};
