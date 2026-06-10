/**
 * External dependencies.
 */
import { type FC } from "react";
import { Loader2, X } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { ProjectHealthReport } from "../../projectHealth/types";

interface RunningHeaderProps {
  report: ProjectHealthReport | null;
  onCancel: () => void;
}

/**
 * In-flight state: a determinate progress bar driven by the report's
 * progress (completed/total), its short label, and a cancel button.
 * Falls back to an indeterminate look when no report has landed yet.
 */
export const RunningHeader: FC<RunningHeaderProps> = ({ report, onCancel }) => {
  const completed = report?.progress.completed ?? 0;
  const total = report?.progress.total ?? 0;
  const label = report?.progress.label ?? "Starting analysis…";
  const percent =
    total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 size={14} className="shrink-0 animate-spin text-sky-500" />
          <span className="truncate" title={label}>
            {label}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={onCancel}
        >
          <X size={12} />
          Cancel
        </button>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-sky-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {total > 0 ? (
        <div className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
          {completed} of {total}
        </div>
      ) : null}
    </div>
  );
};
