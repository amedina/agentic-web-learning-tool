/**
 * External dependencies.
 */
import React from "react";
import { usePropProvider } from "@agentic-labs/chatbot";
import { ReportTab } from "@agentic-labs/package-analyzer-ui";

/**
 * Internal dependencies.
 */
import { type PackageJsonDependencies } from "@agentic-labs/package-analyzer-ui";
import { showGithubRateLimitToastOnce } from "../../utils/githubRateLimitToast";

interface ReportTabProps {
  packageJsonDependencies: PackageJsonDependencies;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

export const ChromeReportTab: React.FC<ReportTabProps> = (props) => {
  const { setActiveTab } = usePropProvider(({ actions }) => ({
    setActiveTab: actions.setActiveTab,
  }));

  return (
    <ReportTab
      {...props}
      onRateLimited={showGithubRateLimitToastOnce}
      onNavigateToComparison={() => setActiveTab("comparison")}
    />
  );
};
