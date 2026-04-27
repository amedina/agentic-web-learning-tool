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
  stats: PackageStats;
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
  stats,
  onAddToCompare,
  isAddedToCompare,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
}) => {
  const {
    packageName,
    githubUrl,
    stars,
    collaboratorsCount,
    lastCommitDate,
    license,
  } = stats;

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
        score={stats.score}
        scoreBreakdown={stats.scoreBreakdown}
        scoreMaxPoints={stats.scoreMaxPoints}
        githubRateLimited={stats.githubRateLimited}
      />

      <PackageInsightsBody
        stats={stats}
        onAddRecommendationToCompare={onAddRecommendationToCompare}
        comparisonBucketNames={comparisonBucketNames}
        addingRecommendations={addingRecommendations}
      />
    </div>
  );
};
