/**
 * External dependencies.
 */
import { type FC, type ReactNode } from "react";

interface StatTileProps {
  icon: ReactNode;
  label: string;
  count: number;
  suffix: string;
  tone: "ok" | "warning";
  active: boolean;
  onClick: () => void;
}

/**
 * Compact, clickable stat tile summarising one analyzer's finding count.
 */
export const StatTile: FC<StatTileProps> = ({
  icon,
  label,
  count,
  suffix,
  tone,
  active,
  onClick,
}) => {
  const palette =
    tone === "ok"
      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/70"
      : "border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/70";
  const activeRing = active ? "ring-2 ring-sky-500 dark:ring-sky-400" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded border px-3 py-2 transition-colors ${palette} ${activeRing}`}
    >
      <div className="flex items-center gap-1 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-lg font-semibold leading-tight">
        {count}
        <span className="ml-1 text-xs font-normal opacity-80">{suffix}</span>
      </div>
    </button>
  );
};
