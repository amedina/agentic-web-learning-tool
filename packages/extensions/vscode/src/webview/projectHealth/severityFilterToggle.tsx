/**
 * External dependencies.
 */
import { type FC } from "react";

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
      className="flex cursor-pointer items-start gap-2 px-1 text-xs text-slate-600 dark:text-slate-400"
      title="By default only advisories at or above your Advisory Severity Floor are shown. Check to include every severity."
    >
      <input
        type="checkbox"
        checked={showAll}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-violet-500"
      />
      <span className="flex flex-col">
        <span className="text-slate-700 dark:text-slate-300">
          Show all severity levels
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {status}
        </span>
      </span>
    </label>
  );
};
