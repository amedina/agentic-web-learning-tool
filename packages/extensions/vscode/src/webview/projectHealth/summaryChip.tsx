/**
 * External dependencies.
 */
import { type FC, type ReactNode } from "react";

interface SummaryChipProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  tone?: "neutral" | "danger" | "ok";
  title?: string;
}

/**
 * One labelled stat chip in the header summary row, e.g. "12 vulns" or
 * "4 packages". The tone tints the value so a non-zero danger count
 * reads as urgent while neutral counts stay muted.
 */
export const SummaryChip: FC<SummaryChipProps> = ({
  icon,
  label,
  value,
  tone = "neutral",
  title,
}) => {
  const valueClass =
    tone === "danger"
      ? "text-red-600 dark:text-red-400"
      : tone === "ok"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-slate-700 dark:text-slate-200";
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 px-2 py-1"
      title={title ?? label}
    >
      {icon ? (
        <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      ) : null}
      <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>
        {value}
      </span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
};
