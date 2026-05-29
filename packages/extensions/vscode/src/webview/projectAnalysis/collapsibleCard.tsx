/**
 * External dependencies.
 */
import { type FC, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleCardProps {
  title: string;
  subtitle?: ReactNode;
  icon: ReactNode;
  badge: number;
  badgeTone: "ok" | "warning";
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/**
 * Lightweight section card with a clickable header that toggles
 * visibility of its body. Shared between the Publishing and Circular
 * Dependencies cards so they have a consistent look.
 */
export const CollapsibleCard: FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  badgeTone,
  collapsed,
  onToggle,
  children,
}) => {
  const badgePalette =
    badgeTone === "ok"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  return (
    <section className="rounded border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {collapsed ? (
            <ChevronRight
              size={14}
              className="text-slate-500 dark:text-slate-400 shrink-0"
            />
          ) : (
            <ChevronDown
              size={14}
              className="text-slate-500 dark:text-slate-400 shrink-0"
            />
          )}
          <span className="text-slate-600 dark:text-slate-300 shrink-0">
            {icon}
          </span>
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide whitespace-nowrap">
            {title}
          </h3>
          {subtitle && (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 normal-case truncate">
              {subtitle}
            </span>
          )}
        </div>
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${badgePalette}`}
        >
          {badge}
        </span>
      </button>
      {!collapsed && (
        <div className="border-t border-slate-200 dark:border-slate-800">
          {children}
        </div>
      )}
    </section>
  );
};
