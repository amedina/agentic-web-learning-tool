/**
 * External dependencies.
 */
import React from "react";
import { usePropProvider } from "@google-awlt/chatbot";
import { ReportTab } from "@google-awlt/package-analyzer-ui";

/**
 * Internal dependencies.
 */
import { type PackageJsonDependencies } from "@google-awlt/package-analyzer-ui";
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
