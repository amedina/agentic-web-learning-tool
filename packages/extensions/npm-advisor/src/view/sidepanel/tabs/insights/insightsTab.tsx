/**
 * External dependencies.
 */
import React from "react";
import { usePropProvider } from "@agentic-web-labs/chatbot";
import { InsightsTab } from "@agentic-web-labs/package-analyzer-ui";
import { type PackageStats } from "@agentic-web-labs/package-analyzer-core";

interface InsightsTabProps {
  stats: PackageStats | null;
  pendingPackageName: string | null;
  isLoading: boolean;
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

export const ChromeInsightsTab: React.FC<InsightsTabProps> = (props) => {
  const { setActiveTab } = usePropProvider(({ actions }) => ({
    setActiveTab: actions.setActiveTab,
  }));

  return (
    <InsightsTab
      {...props}
      onNavigateToComparison={() => setActiveTab("comparison")}
    />
  );
};
