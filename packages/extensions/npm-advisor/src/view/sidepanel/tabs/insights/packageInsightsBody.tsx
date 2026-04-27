/**
 * External dependencies.
 */
import React from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../../lib";
import {
  Header,
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
  /**
   * Renders BundleFootprint in a loading state. Used by the Report tab,
   * where the bundle is fetched lazily on accordion expand.
   */
  bundleLoading?: boolean;
  /**
   * When true, prepends the full Header widget (package name, github link,
   * stars, collabs, last commit, fitness score) to the body. Used by the
   * Report tab's accordion rows so each expanded dep shows the same set
   * of stats as the main Insights tab, not just the bottom widgets.
   */
  showHeader?: boolean;
  /**
   * Renders the DependencyTree widget in a loading state. Used by the
   * Report tab when the tree is fetched lazily on accordion expand.
   */
  dependencyTreeLoading?: boolean;
  /**
   * Hide the Responsiveness widget. Used by the Report tab where the
   * issues data isn't loaded for individual deps (Search API quota), so
   * showing the widget would be misleading.
   */
  hideResponsiveness?: boolean;
  /**
   * Hide the Fitness column from the embedded Header. Used together with
   * `hideResponsiveness` since Fitness is a composite that includes
   * Responsiveness — without that signal the score is misleading.
   */
  hideFitness?: boolean;
}

export const PackageInsightsBody: React.FC<PackageInsightsBodyProps> = ({
  stats,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
  showDependencyTree = true,
  bundleLoading = false,
  showHeader = false,
  dependencyTreeLoading = false,
  hideResponsiveness = false,
  hideFitness = false,
}) => {
  const {
    packageName,
    githubUrl,
    stars,
    collaboratorsCount,
    lastCommitDate,
    license,
    score,
    scoreBreakdown,
    scoreMaxPoints,
    responsiveness,
    securityAdvisories,
    bundle,
    licenseCompatibility,
    recommendations,
    dependencyTree,
    githubRateLimited,
    githubIssuesUnavailable,
  } = stats;

  // For accordion-mounted Headers we route the "+ Compare" button through
  // the same handler the Recommendations widget uses, so a dep can be
  // added to the comparison bucket without extra plumbing.
  const headerIsAddedToCompare =
    comparisonBucketNames?.has(packageName) ?? false;

  return (
    <div className="space-y-4">
      {showHeader && (
        <Header
          packageName={packageName}
          githubUrl={githubUrl}
          stars={stars}
          collaboratorsCount={collaboratorsCount}
          lastCommitDate={lastCommitDate}
          license={license}
          score={score}
          scoreBreakdown={scoreBreakdown}
          scoreMaxPoints={scoreMaxPoints}
          githubRateLimited={githubRateLimited}
          isAddedToCompare={headerIsAddedToCompare}
          onAddToCompare={() => onAddRecommendationToCompare?.(packageName)}
          hideFitness={hideFitness}
        />
      )}

      {hideResponsiveness ? (
        <LicenseCheck licenseCompatibility={licenseCompatibility} />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <LicenseCheck licenseCompatibility={licenseCompatibility} />
          <Responsiveness
            responsiveness={responsiveness as any}
            githubRateLimited={githubRateLimited}
            githubIssuesUnavailable={githubIssuesUnavailable}
          />
        </div>
      )}

      <BundleFootprint bundle={bundle} isLoading={bundleLoading} />
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
      {showDependencyTree && (
        <DependencyTree
          dependencyTree={dependencyTree}
          isLoading={dependencyTreeLoading}
        />
      )}
    </div>
  );
};
