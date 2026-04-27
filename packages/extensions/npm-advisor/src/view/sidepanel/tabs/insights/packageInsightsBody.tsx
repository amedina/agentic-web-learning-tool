/**
 * External dependencies.
 */
import React from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../../lib";
import {
  LicenseCheck,
  Responsiveness,
  BundleFootprint,
  SecurityAdvisories,
  Recommendations,
  DependencyTree,
} from "../../widgets";

interface PackageInsightsBodyProps {
  stats: PackageStats;
  onAddRecommendationToCompare?: (packageName: string) => void;
  comparisonBucketNames?: Set<string>;
  addingRecommendations?: Set<string>;
  showDependencyTree?: boolean;
}

export const PackageInsightsBody: React.FC<PackageInsightsBodyProps> = ({
  stats,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
  showDependencyTree = true,
}) => {
  const {
    responsiveness,
    securityAdvisories,
    bundle,
    licenseCompatibility,
    recommendations,
    dependencyTree,
    githubRateLimited,
  } = stats;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <LicenseCheck licenseCompatibility={licenseCompatibility} />
        <Responsiveness
          responsiveness={responsiveness as any}
          githubRateLimited={githubRateLimited}
        />
      </div>

      <BundleFootprint bundle={bundle} />
      <SecurityAdvisories
        securityAdvisories={securityAdvisories}
        githubRateLimited={githubRateLimited}
      />
      <Recommendations
        recommendations={recommendations}
        onAddToCompare={onAddRecommendationToCompare}
        comparisonBucketNames={comparisonBucketNames}
        addingRecommendations={addingRecommendations}
      />
      {showDependencyTree && <DependencyTree dependencyTree={dependencyTree} />}
    </div>
  );
};
