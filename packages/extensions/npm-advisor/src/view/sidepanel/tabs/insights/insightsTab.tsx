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
import { DependenciesOnlyInsights } from "./dependenciesOnlyInsights";

interface InsightsTabProps {
  stats: PackageStats | null;
  pendingPackageName: string | null;
  isLoading: boolean;
  isDependenciesOnly?: boolean;
  unpublishedPackageName?: string | null;
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

/**
 * Renders the Insights tab content for the npm-advisor side panel. Defers to
 * the shared `InsightsTab` for normal packages, and substitutes a friendly
 * empty-state card when the active page is a `package.json` that has no
 * published package to score — either a monorepo root with no `name`, or a
 * named package that isn't published on npm. In both cases the Dependencies
 * tab can still do useful work.
 */
export const ChromeInsightsTab: React.FC<InsightsTabProps> = (props) => {
  const { setActiveTab } = usePropProvider(({ actions }) => ({
    setActiveTab: actions.setActiveTab,
  }));

  if (props.isDependenciesOnly) {
    return (
      <DependenciesOnlyInsights
        unpublishedPackageName={props.unpublishedPackageName ?? null}
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
