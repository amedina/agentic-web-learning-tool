/**
 * External dependencies.
 */
import { type FC } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface StaleBannerProps {
  changedFileDisplayPath: string;
  onRerun: () => void;
}

/**
 * Banner shown above the body when the host signals that the file
 * the most recent analysis was based on has changed since the run.
 * The body still renders the previous findings (dimmed visually by
 * the banner alone, no extra CSS gymnastics) so the user doesn't
 * lose context, but the call-to-action makes clear they need to
 * re-run before trusting the displayed numbers.
 */
export const StaleBanner: FC<StaleBannerProps> = ({
  changedFileDisplayPath,
  onRerun,
}) => {
  return (
    <div className="flex items-start gap-2 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold">Results are out of date.</div>
        <div
          className="mt-0.5 text-amber-700 dark:text-amber-300 break-all"
          title={changedFileDisplayPath}
        >
          <code className="font-mono">{changedFileDisplayPath}</code> changed
          since the last run.
        </div>
      </div>
      <button
        type="button"
        onClick={onRerun}
        className="inline-flex items-center gap-1 rounded border border-amber-400 dark:border-amber-700 bg-amber-100 dark:bg-amber-900 px-2 py-1 text-xs font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800"
      >
        <RefreshCw size={12} />
        Re-run
      </button>
    </div>
  );
};
