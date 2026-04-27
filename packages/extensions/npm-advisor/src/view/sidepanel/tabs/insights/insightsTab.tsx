/**
 * External dependencies.
 */
import React from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../../lib";
import { Header } from "../../widgets";
import { PackageInsightsBody } from "./packageInsightsBody";

interface InsightsTabProps {
  stats: PackageStats | null;
  /**
   * Best-effort package name derived from the active tab URL. Used so the
   * Header can render its title immediately while the per-package fetch
   * is still in flight, instead of falling back to a full-page loader.
   */
  pendingPackageName: string | null;
  isLoading: boolean;
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

const EMPTY_STATS_DEFAULTS = {
  packageName: "",
  githubUrl: null,
  stars: null,
  collaboratorsCount: null,
  lastCommitDate: null,
  license: null,
  score: null,
  scoreBreakdown: undefined,
  scoreMaxPoints: undefined,
  responsiveness: null,
  securityAdvisories: null,
  bundle: null,
  licenseCompatibility: null,
  recommendations: {} as PackageStats["recommendations"],
  dependencyTree: null,
  githubRateLimited: false,
  githubIssuesUnavailable: false,
};

export const InsightsTab: React.FC<InsightsTabProps> = ({
  stats,
  pendingPackageName,
  isLoading,
  onAddToCompare,
  isAddedToCompare,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
}) => {
  const effectiveStats: PackageStats =
    stats ??
    ({
      ...EMPTY_STATS_DEFAULTS,
      packageName: pendingPackageName ?? "",
    } as unknown as PackageStats);

  const {
    packageName,
    githubUrl,
    stars,
    collaboratorsCount,
    lastCommitDate,
    license,
  } = effectiveStats;

  return (
    <div className="text-slate-800 dark:text-slate-200 p-4 space-y-4 h-full overflow-y-auto">
      <Header
        packageName={packageName}
        githubUrl={githubUrl}
        stars={stars}
        collaboratorsCount={collaboratorsCount}
        lastCommitDate={lastCommitDate}
        license={license}
        onAddToCompare={onAddToCompare}
        isAddedToCompare={isAddedToCompare}
        score={effectiveStats.score}
        scoreBreakdown={effectiveStats.scoreBreakdown}
        scoreMaxPoints={effectiveStats.scoreMaxPoints}
        githubRateLimited={effectiveStats.githubRateLimited}
        isLoading={isLoading}
      />

      <PackageInsightsBody
        stats={effectiveStats}
        onAddRecommendationToCompare={onAddRecommendationToCompare}
        comparisonBucketNames={comparisonBucketNames}
        addingRecommendations={addingRecommendations}
        isLoading={isLoading}
      />
    </div>
  );
};
