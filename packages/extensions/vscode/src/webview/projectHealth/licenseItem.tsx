/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import type { LicenseFinding } from "../../projectHealth/types";

interface LicenseItemProps {
  finding: LicenseFinding;
}

/**
 * A single license issue line: the package name, its license (or
 * "unknown" when unresolved), and an explanation when one is available.
 */
export const LicenseItem: FC<LicenseItemProps> = ({ finding }) => {
  return (
    <li className="flex flex-col gap-0.5 rounded border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className="truncate font-medium text-slate-700 dark:text-slate-200"
          title={finding.packageName}
        >
          {finding.packageName}
        </span>
        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {finding.license ?? "unknown"}
        </span>
      </div>
      {finding.explanation ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {finding.explanation}
        </p>
      ) : null}
    </li>
  );
};
