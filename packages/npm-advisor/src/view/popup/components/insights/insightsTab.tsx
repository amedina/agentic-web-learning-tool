/**
 * External dependencies.
 */
import React from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../../utils";
import {
  Header,
  LicenseCheck,
  Responsiveness,
  BundleFootprint,
  SecurityAdvisories,
  Recommendations,
  DependencyTree,
} from "../../widgets";

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
    responsiveness,
    securityAdvisories,
    bundle,
    license,
    licenseCompatibility,
    recommendations,
    dependencyTree,
  } = stats;

  return (
    <div className="text-slate-800 dark:text-slate-200 p-4 space-y-4">
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
      />

      <div className="grid grid-cols-2 gap-4">
        <LicenseCheck licenseCompatibility={licenseCompatibility} />
        <Responsiveness responsiveness={responsiveness as any} />
      </div>

      <BundleFootprint bundle={bundle} />
      <SecurityAdvisories securityAdvisories={securityAdvisories} />
      <Recommendations
        recommendations={recommendations}
        onAddToCompare={onAddRecommendationToCompare}
        comparisonBucketNames={comparisonBucketNames}
        addingRecommendations={addingRecommendations}
      />
      <DependencyTree dependencyTree={dependencyTree} />
    </div>
  );
};
