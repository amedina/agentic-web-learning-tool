/**
 * External dependencies.
 */
import { type FC } from "react";
import { ShieldAlert } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { AdvisorySeverityFloor } from "../../projectHealth/types";

interface SeverityFilterToggleProps {
  /** True when every severity is shown (the floor filter is bypassed). */
  showAll: boolean;
  /** The configured `npmAdvisor.advisorySeverityFloor`. */
  floor: AdvisorySeverityFloor;
  /** Active vulnerabilities currently hidden by the floor. */
  hiddenCount: number;
  /** Turn the "show all severities" view on or off. */
  onChange: (showAll: boolean) => void;
}

/**
 * Checkbox row for the Dependencies tab that decides whether the
 * vulnerability list honors the Advisory Severity Floor setting (the
 * default) or shows every severity. By default the list mirrors the
 * setting so users only see advisories at or above the floor they have
 * chosen to care about; checking the box reveals the lower-severity
 * advisories below the floor.
 */
export const SeverityFilterToggle: FC<SeverityFilterToggleProps> = ({
  showAll,
  floor,
  hiddenCount,
  onChange,
}) => {
  const status = showAll
    ? "Showing all severity levels."
    : hiddenCount > 0
      ? `Showing ${floor} and above. ${hiddenCount} lower-severity hidden.`
      : `Showing ${floor} and above.`;

  return (
    <label
      className="flex cursor-pointer items-center gap-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 px-3 py-2 text-xs text-slate-700 dark:text-slate-200"
      title="By default only advisories at or above your Advisory Severity Floor are shown. Check to include every severity."
    >
      <input
        type="checkbox"
        checked={showAll}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 shrink-0 accent-violet-500"
      />
      <ShieldAlert
        size={14}
        className="shrink-0 text-slate-500 dark:text-slate-400"
      />
      <span className="flex flex-col">
        <span className="font-medium text-slate-800 dark:text-slate-100">
          Show all severity levels
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {status}
        </span>
      </span>
    </label>
  );
};
