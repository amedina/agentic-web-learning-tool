/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import { TabButton } from "./tabButton";

export type ActiveTab = "dependencies" | "project";

interface TabBarProps {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

/**
 * Two-tab strip below the package.json switcher. Switches between the
 * existing per-dep view and the new project-level analysis tab.
 */
export const TabBar: FC<TabBarProps> = ({ activeTab, onChange }) => {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
      <TabButton
        label="Dependencies"
        isActive={activeTab === "dependencies"}
        onClick={() => onChange("dependencies")}
      />
      <TabButton
        label="Project Analysis"
        isActive={activeTab === "project"}
        onClick={() => onChange("project")}
      />
    </div>
  );
};
