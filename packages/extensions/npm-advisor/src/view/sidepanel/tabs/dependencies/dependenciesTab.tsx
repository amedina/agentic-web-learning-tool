/**
 * External dependencies.
 */
import React from "react";
import { usePropProvider } from "@agentic-web-labs/chatbot";
import {
  DependenciesTab,
  type PackageJsonDependencies,
} from "@agentic-web-labs/package-analyzer-ui";

/**
 * Internal dependencies.
 */
import { showGithubRateLimitToastOnce } from "../../utils/githubRateLimitToast";

interface DependenciesTabProps {
  packageJsonDependencies: PackageJsonDependencies;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

export const ChromeDependenciesTab: React.FC<DependenciesTabProps> = (
  props,
) => {
  const { setActiveTab } = usePropProvider(({ actions }) => ({
    setActiveTab: actions.setActiveTab,
  }));

  return (
    <DependenciesTab
      {...props}
      onRateLimited={showGithubRateLimitToastOnce}
      onNavigateToComparison={() => setActiveTab("comparison")}
    />
  );
};
