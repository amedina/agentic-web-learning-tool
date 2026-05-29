/**
 * External dependencies.
 */
import React from "react";
import { usePropProvider } from "@agentic-web-labs/chatbot";
import { InsightsTab } from "@agentic-web-labs/package-analyzer-ui";
import { type PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { WorkspaceRootInsights } from "./workspaceRootInsights";

interface InsightsTabProps {
  stats: PackageStats | null;
  pendingPackageName: string | null;
  isLoading: boolean;
  isWorkspaceRoot?: boolean;
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

/**
 * Renders the Insights tab content for the npm-advisor side panel. Defers to
 * the shared `InsightsTab` for normal packages, and substitutes a friendly
 * "workspace root" card when the active page is a monorepo `package.json`
 * with no `name` field — there's no package to analyze, but the Dependencies
 * tab can still do useful work.
 */
export const ChromeInsightsTab: React.FC<InsightsTabProps> = (props) => {
  const { setActiveTab } = usePropProvider(({ actions }) => ({
    setActiveTab: actions.setActiveTab,
  }));

  if (props.isWorkspaceRoot) {
    return (
      <WorkspaceRootInsights
        onOpenDependencies={() => setActiveTab("dependencies")}
      />
    );
  }

  return (
    <InsightsTab
      {...props}
      onNavigateToComparison={() => setActiveTab("comparison")}
    />
  );
};
