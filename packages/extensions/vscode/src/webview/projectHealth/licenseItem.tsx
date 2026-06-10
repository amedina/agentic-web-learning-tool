/**
 * External dependencies.
 */
import { type FC } from "react";
import { Bell, BellOff } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useSuppression } from "./suppressionContext";
import { isLicenseSuppressed } from "../../projectHealth/suppressionMatching";
import type { LicenseFinding } from "../../projectHealth/types";

interface LicenseItemProps {
  finding: LicenseFinding;
}

/**
 * A single license issue line: the package name, its license (or
 * "unknown" when unresolved), and an explanation when one is available.
 * When the finding has been muted it renders dimmed with an "Unmute"
 * button; otherwise it offers a small "Mute" button to suppress it.
 */
export const LicenseItem: FC<LicenseItemProps> = ({ finding }) => {
  const { suppressions, onMute, onUnmute } = useSuppression();
  const muted = isLicenseSuppressed(suppressions, finding);
  const target = {
    kind: "license" as const,
    packageName: finding.packageName,
  };

  return (
    <li
      className={`flex flex-col gap-0.5 rounded border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900 ${
        muted ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className="truncate font-medium text-slate-700 dark:text-slate-200"
          title={finding.packageName}
        >
          {finding.packageName}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            {finding.license ?? "unknown"}
          </span>
          {muted ? (
            <button
              type="button"
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-slate-500 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              title="Unmute this license issue"
              onClick={() => onUnmute(target)}
            >
              <Bell size={11} />
              Unmute
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-slate-500 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
              title="Mute this license issue"
              onClick={() => onMute(target)}
            >
              <BellOff size={11} />
              Mute
            </button>
          )}
        </div>
      </div>
      {finding.explanation ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {finding.explanation}
        </p>
      ) : null}
    </li>
  );
};
