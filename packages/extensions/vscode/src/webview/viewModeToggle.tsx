/**
 * External dependencies.
 */
import { type FC } from "react";
import { FolderGit2, Package } from "lucide-react";

/** The two top-level views the panel can show. */
export type ViewMode = "package" | "project";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/** Builds the className for one segmented-control button by active state. */
function buttonClass(isActive: boolean): string {
  const base =
    "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs font-medium";
  const active = "bg-sky-500 text-white";
  const inactive =
    "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
  return `${base} ${isActive ? active : inactive}`;
}

/**
 * Segmented control at the very top of the panel that switches between
 * the per-package view (the active package.json's dependencies +
 * project analysis) and the workspace-wide Project Health roll-up.
 */
export const ViewModeToggle: FC<ViewModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex gap-1 p-2 border-b border-slate-200 dark:border-slate-800">
      <button
        type="button"
        className={buttonClass(mode === "package")}
        onClick={() => onChange("package")}
      >
        <Package size={13} />
        This package
      </button>
      <button
        type="button"
        className={buttonClass(mode === "project")}
        onClick={() => onChange("project")}
      >
        <FolderGit2 size={13} />
        All packages
      </button>
    </div>
  );
};
