/**
 * External dependencies.
 */
import { type FC, type ReactNode } from "react";

interface SummaryChipProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  tone?: "neutral" | "danger" | "warning" | "ok" | "info";
  title?: string;
  /** When provided, the chip renders as a button that filters the list. */
  onClick?: () => void;
  /** Highlights the chip when its filter is the active one. */
  isActive?: boolean;
}

/**
 * One labelled stat chip in the header summary row, e.g. "12 vulns" or
 * "4 packages". The tone tints the value so a non-zero danger count
 * reads as urgent while neutral counts stay muted; `info` (sky) is for
 * informational tallies like replacement suggestions. When `onClick` is
 * given the chip becomes a filter toggle and shows a ring while active.
 */
export const SummaryChip: FC<SummaryChipProps> = ({
  icon,
  label,
  value,
  tone = "neutral",
  title,
  onClick,
  isActive = false,
}) => {
  const valueClass =
    tone === "danger"
      ? "text-red-600 dark:text-red-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "ok"
          ? "text-emerald-600 dark:text-emerald-400"
          : tone === "info"
            ? "text-sky-600 dark:text-sky-400"
            : "text-slate-700 dark:text-slate-200";
  const baseClass =
    "inline-flex items-center gap-1.5 rounded border px-2 py-1 bg-white/40 dark:bg-slate-900/40";
  const stateClass = isActive
    ? "border-sky-500 ring-1 ring-sky-400"
    : "border-slate-200 dark:border-slate-700";
  const interactiveClass = onClick
    ? "cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
    : "";
  // Static stat chips (no onClick) read as information, not actions: a
  // dashed, transparent, lower-contrast look that does not invite a click.
  const staticClass =
    "inline-flex items-center gap-1.5 rounded border border-dashed border-slate-300/70 dark:border-slate-700/70 px-2 py-1 opacity-80 cursor-default";
  const content = (
    <>
      {icon ? (
        <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      ) : null}
      <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>
        {value}
      </span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${baseClass} ${stateClass} ${interactiveClass}`}
        title={title ?? label}
        aria-pressed={isActive}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }
  return (
    <div className={staticClass} title={title ?? label}>
      {content}
    </div>
  );
};
