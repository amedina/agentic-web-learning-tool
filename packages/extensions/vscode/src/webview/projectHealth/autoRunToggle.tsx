/**
 * External dependencies.
 */
import { useState, type FC } from "react";
import { CalendarClock, ChevronDown, ChevronRight } from "lucide-react";

interface AutoRunToggleProps {
  /** True when the daily dependency check is enabled. */
  enabled: boolean;
  /** Turn the daily check on or off. */
  onChange: (enabled: boolean) => void;
}

/**
 * Collapsible in-panel control for the daily dependency health check.
 * Collapsed by default to save space (mirroring the "Fix these with your
 * AI assistant" callout); the header shows the current On / Off state so
 * it reads at a glance, and expanding reveals an explanation plus the
 * switch. Toggling writes `npmAdvisor.projectHealth.autoRun` (via the
 * host) so NPM Advisor scans vulnerabilities + license issues across the
 * workspace once a day while the editor is open and notifies the user.
 */
export const AutoRunToggle: FC<AutoRunToggleProps> = ({
  enabled,
  onChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 text-xs text-slate-700 dark:text-slate-200">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown size={14} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-slate-400" />
        )}
        <CalendarClock
          size={14}
          className="shrink-0 text-slate-500 dark:text-slate-400"
        />
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          Daily dependency check
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            enabled
              ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {enabled ? "On" : "Off"}
        </span>
      </button>
      {expanded ? (
        <div className="px-3 pb-3 pl-9">
          <div className="text-slate-600 dark:text-slate-300">
            Scans vulnerabilities and license issues once a day while the editor
            is open, then notifies you of new findings. The slower project
            analysis is never run automatically.
          </div>
          <div className="mt-2 flex items-center gap-2">
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
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
