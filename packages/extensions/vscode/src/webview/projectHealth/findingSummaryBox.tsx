/**
 * External dependencies.
 */
import { type FC, type ReactNode } from "react";

type BoxTone = "danger" | "warning" | "info";

interface FindingSummaryBoxProps {
  icon: ReactNode;
  label: string;
  count: number;
  tone: BoxTone;
  /** Shown when `count` is zero. */
  emptyText: string;
  children?: ReactNode;
}

/** Tailwind tone palette for a non-empty box of the given category. */
const TONE_CLASSES: Record<BoxTone, { border: string; accent: string }> = {
  danger: {
    border:
      "border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30",
    accent: "text-red-600 dark:text-red-400",
  },
  warning: {
    border:
      "border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30",
    accent: "text-amber-600 dark:text-amber-400",
  },
  info: {
    border:
      "border-sky-300 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/30",
    accent: "text-sky-600 dark:text-sky-400",
  },
};

const OK_CLASSES = {
  border:
    "border-emerald-300 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20",
  accent: "text-emerald-600 dark:text-emerald-400",
};

/**
 * A prominent, colored summary box for one finding category in a
 * Project Health row (vulnerabilities, license issues, or replaceable
 * dependencies). Shows the count in the header and the items below; a
 * clean (zero) category renders in the calm "ok" palette instead.
 */
export const FindingSummaryBox: FC<FindingSummaryBoxProps> = ({
  icon,
  label,
  count,
  tone,
  emptyText,
  children,
}) => {
  const palette = count > 0 ? TONE_CLASSES[tone] : OK_CLASSES;
  return (
    <section className={`rounded border p-2.5 ${palette.border}`}>
      <header className="flex items-center gap-2">
        <span className={palette.accent}>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <span
          className={`ml-auto text-sm font-bold tabular-nums ${palette.accent}`}
        >
          {count}
        </span>
      </header>
      {count > 0 ? (
        <div className="mt-2">{children}</div>
      ) : (
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {emptyText}
        </div>
      )}
    </section>
  );
};
