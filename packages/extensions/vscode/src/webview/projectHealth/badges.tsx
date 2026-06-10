/**
 * External dependencies.
 */
import { type FC, type ReactNode } from "react";

interface CountBadgeProps {
  icon?: ReactNode;
  count: number;
  label: string;
  tone?: "neutral" | "warning";
}

/**
 * A compact count badge for the collapsed roll-up row, e.g. a license
 * issue count or a publint count. Hidden entirely when `count` is zero
 * so clean rows stay uncluttered.
 */
export const CountBadge: FC<CountBadgeProps> = ({
  icon,
  count,
  label,
  tone = "neutral",
}) => {
  if (count <= 0) {
    return null;
  }
  const toneClass =
    tone === "warning"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${toneClass}`}
      title={`${count} ${label}`}
    >
      {icon}
      {count}
    </span>
  );
};
