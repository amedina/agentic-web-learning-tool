/**
 * External dependencies.
 */
import { type FC } from "react";
import { HelpCircle, Loader2, PlayCircle, RefreshCw } from "lucide-react";

/**
 * Internal dependencies.
 */
import { statusHint } from "./helpers";
import type { Status } from "./types";

interface HeaderProps {
  status: Status;
  onRun: () => void;
  disabled: boolean;
  showAbout: boolean;
  onToggleAbout: () => void;
}

/**
 * Renders the run button, a help toggle, and a one-line status hint
 * above the body. The help toggle reveals the per-analyzer descriptions
 * that previously only showed in the idle state — handy after a run
 * has populated the body and the user wants a refresher on what each
 * check actually inspects.
 */
export const Header: FC<HeaderProps> = ({
  status,
  onRun,
  disabled,
  showAbout,
  onToggleAbout,
}) => {
  const isReady = status.kind === "ready";
  const isRunning = status.kind === "running";
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {statusHint(status)}
      </div>
      <div className="flex items-center gap-1">
        {isReady && (
          <button
            type="button"
            className={`inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 ${
              showAbout
                ? "bg-slate-100 dark:bg-slate-700"
                : "bg-slate-50 dark:bg-slate-800"
            }`}
            onClick={onToggleAbout}
            aria-label="About this analysis"
            title="About this analysis"
            aria-pressed={showAbout}
          >
            <HelpCircle size={12} />
          </button>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onRun}
          disabled={disabled}
        >
          {isRunning ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isReady ? (
            <RefreshCw size={12} />
          ) : (
            <PlayCircle size={12} />
          )}
          {isReady ? "Re-run analysis" : "Run analysis"}
        </button>
      </div>
    </div>
  );
};
