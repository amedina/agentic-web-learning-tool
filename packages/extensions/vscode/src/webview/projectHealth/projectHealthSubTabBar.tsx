/**
 * External dependencies.
 */
import { type FC } from "react";

/** The two sub-tabs of the Project Health view. */
export type ProjectHealthSubTab = "dependencies" | "project";

interface ProjectHealthSubTabBarProps {
  /** Which sub-tab is currently shown. */
  activeTab: ProjectHealthSubTab;
  /** Switch to a different sub-tab. */
  onChange: (tab: ProjectHealthSubTab) => void;
}

/**
 * Two-tab strip inside the Project Health mode. Splits the fast
 * dependency check ("Dependencies") from the slower publint + circular +
 * replacement pass ("Analysis") so each can be run on its own.
 * Mirrors the top-level {@link TabBar} styling (border-bottom strip with
 * an active underline) for visual consistency.
 */
export const ProjectHealthSubTabBar: FC<ProjectHealthSubTabBarProps> = ({
  activeTab,
  onChange,
}) => {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
      <button
        type="button"
        className={`px-3 py-2 border-b-2 -mb-px ${
          activeTab === "dependencies"
            ? "border-sky-500 text-slate-900 dark:text-slate-100"
            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        }`}
        onClick={() => onChange("dependencies")}
      >
        Dependencies
      </button>
      <button
        type="button"
        className={`px-3 py-2 border-b-2 -mb-px ${
          activeTab === "project"
            ? "border-sky-500 text-slate-900 dark:text-slate-100"
            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        }`}
        onClick={() => onChange("project")}
      >
        Analysis
      </button>
    </div>
  );
};
