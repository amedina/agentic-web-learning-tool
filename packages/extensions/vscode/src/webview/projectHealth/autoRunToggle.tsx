/**
 * External dependencies.
 */
import { type FC } from "react";
import { CalendarClock } from "lucide-react";

interface AutoRunToggleProps {
  /** True when the daily dependency check is enabled. */
  enabled: boolean;
  /** Turn the daily check on or off. */
  onChange: (enabled: boolean) => void;
}

/**
 * In-panel switch for the daily dependency health check. Toggling it
 * writes `npmAdvisor.projectHealth.autoRun` (via the host) so NPM Advisor
 * scans vulnerabilities + license issues across the workspace once a day
 * while the editor is open and notifies the user of new findings.
 */
export const AutoRunToggle: FC<AutoRunToggleProps> = ({
  enabled,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-3 rounded border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 px-3 py-2">
      <CalendarClock
        size={16}
        className="shrink-0 text-slate-500 dark:text-slate-400"
      />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
          Run a daily dependency check
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Scans vulnerabilities and license issues once a day while the editor
          is open, then notifies you of new findings.
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Run a daily dependency check"
        title={
          enabled
            ? "Daily dependency check is on. Click to turn it off."
            : "Daily dependency check is off. Click to turn it on."
        }
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          enabled ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
};
