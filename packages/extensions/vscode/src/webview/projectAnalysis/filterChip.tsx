/**
 * External dependencies.
 */
import { type FC } from "react";

interface FilterChipProps {
  label: string;
  tone: "neutral" | "error" | "warning" | "info";
  isActive: boolean;
  onClick: () => void;
}

/**
 * Toggleable severity-count chip used in the publint filter bar.
 */
export const FilterChip: FC<FilterChipProps> = ({
  label,
  tone,
  isActive,
  onClick,
}) => {
  const palette: Record<FilterChipProps["tone"], string> = {
    neutral:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
    error:
      "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900",
    warning:
      "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900",
    info: "bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:hover:bg-sky-900",
  };
  const ring = isActive ? "ring-1 ring-sky-500 dark:ring-sky-400" : "ring-0";
  return (
    <button
      type="button"
      className={`px-2 py-0.5 rounded font-medium ${palette[tone]} ${ring}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
