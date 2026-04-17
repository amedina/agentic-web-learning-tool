/**
 * External dependencies.
 */
import React from "react";
import { usePropProvider } from "@google-awlt/chatbot";

/**
 * Internal dependencies.
 */
import { SidepanelComparisonTable } from "./sidepanelComparisonTable";

export const ComparisonTab: React.FC = () => {
  const { setActiveTab } = usePropProvider(({ actions }) => ({
    setActiveTab: actions.setActiveTab,
  }));

  return (
    <div className="text-slate-800 dark:text-slate-200 p-4 h-full overflow-y-auto">
      <SidepanelComparisonTable onClear={() => setActiveTab("insights")} />
    </div>
  );
};
