/**
 * Internal dependencies.
 */
import { fetchNpmPackage } from "./fetchNpmPackage";
import { fetchGithubRepo } from "./fetchGithubRepo";
import { fetchGithubIssues } from "./fetchGithubIssues";
import { fetchGithubSecurityAdvisories } from "./fetchGithubSecurityAdvisories";
import { fetchBundlephobiaData } from "./fetchBundlephobiaData";
import { getDependencyTree, type DependencyTree } from "./getDependencyTree";
import { fetchModuleReplacements } from "./fetchModuleReplacements";

/**
 * External dependencies.
 */
import {
  checkLicenseCompatibility,
  type LicenseCompatibilityResult,
} from "./checkLicenseCompatibility";
import { parseGithubUrl } from "./parseGithubUrl";

export interface PackageStats {
  packageName: string;
  githubUrl: string | null;
  stars: number | null;
  collaboratorsCount: number | null;
  lastCommitDate: string | null;
  responsiveness: {
    closedIssuesRatio: number | null;
    sampleSize: number;
    openIssuesCount: number;
    issuesUrl: string;
    description: string;
  } | null;
  securityAdvisories: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    issues: Array<{ summary: string; severity: string; url: string }>;
  } | null;
  bundle: {
    size: number;
    gzip: number;
    isTreeShakeable: boolean;
    hasSideEffects: boolean | string[];
  } | null;
  dependencyTree: DependencyTree | null;
  license: string | null;
  licenseCompatibility: LicenseCompatibilityResult | null;
  recommendations: {
    nativeReplacements?: any;
    microUtilityReplacements?: any;
    preferredReplacements?: any;
  };
  score: number;
}

/**
 * Get Package Stats.
 */
export async function getPackageStats(
  packageName: string,
  targetLicense: string = "MIT",
): Promise<PackageStats | null> {
  console.log(`[NPM Advisor] Fetching stats for ${packageName}...`);

  const [
    npmData,
    bundleData,
    dependencyTree,
    nativeReplacementsRaw,
    microUtilityReplacementsRaw,
    preferredReplacementsRaw,
  ] = await Promise.all([
    fetchNpmPackage(packageName),
    fetchBundlephobiaData(packageName).catch((e) => {
      console.warn(
        `[NPM Advisor] Failed to fetch bundle data for ${packageName}`,
        e,
      );
      return null;
    }),
    getDependencyTree(packageName).catch((e) => {
      console.warn(
        `[NPM Advisor] Failed to fetch dependency tree for ${packageName}`,
        e,
      );
      return null;
    }),
    fetchModuleReplacements("native").catch(() => null),
    fetchModuleReplacements("micro-utilities").catch(() => null),
    fetchModuleReplacements("preferred").catch(() => null),
  ]);

  if (!npmData) {
    console.warn(`[NPM Advisor] Could not find NPM data for ${packageName}`);
    return null;
  }

  const collaboratorsCount = npmData.maintainers?.length || null;

  let bundle = null;
  if (bundleData) {
    bundle = {
      size: bundleData.size,
      gzip: bundleData.gzip,
      isTreeShakeable: bundleData.hasJSModule,
      hasSideEffects: bundleData.hasSideEffects,
    };
  }

  // Extract repo URL from latest version or repository field
  const latestVersion = npmData["dist-tags"]?.latest;
  const repoUrlField = latestVersion
    ? npmData.versions[latestVersion]?.repository?.url
    : npmData.repository?.url;

  const rawLicense = latestVersion
    ? npmData.versions[latestVersion]?.license
    : npmData.license;

  const licenseStr =
    typeof rawLicense === "string" ? rawLicense : rawLicense?.type || null;
  const licenseCompatibility = checkLicenseCompatibility(
    licenseStr,
    targetLicense,
  );

  const githubInfo = repoUrlField ? parseGithubUrl(repoUrlField) : null;

  let stars = null;
  let lastCommitDate = null;
  let responsiveness = null;
  let securityAdvisories = null;

  if (githubInfo) {
    try {
      const { owner, repo } = githubInfo;

      const [repoData, issuesData, advisoriesData] = await Promise.all([
        fetchGithubRepo(owner, repo).catch((e) => {
          console.warn(`[NPM Advisor] GitHub Repo fetch failed:`, e.message);
          return null;
        }),
        fetchGithubIssues(owner, repo).catch((e) => {
          console.warn(`[NPM Advisor] GitHub Issues fetch failed:`, e.message);
          return null;
        }),
        fetchGithubSecurityAdvisories(owner, repo).catch((e) => {
          console.warn(
            `[NPM Advisor] GitHub Advisories fetch failed:`,
            e.message,
          );
          return null;
        }),
      ]);

      if (repoData && repoData.repo) {
        stars = repoData.repo.stars;
        lastCommitDate = repoData.repo.pushedAt || repoData.repo.updatedAt;
      }

      const issuesList =
        issuesData?.items || (Array.isArray(issuesData) ? issuesData : null);

      if (issuesList && Array.isArray(issuesList)) {
        const totalSample = issuesList.length;
        if (totalSample > 0) {
          const closedCount = issuesList.filter(
            (issue: any) => issue.state === "closed",
          ).length;
          const openCount = totalSample - closedCount;
          const ratio = closedCount / totalSample;
          let desc = "Unknown";
          if (ratio > 0.8) desc = "Highly Responsive";
          else if (ratio > 0.5) desc = "Moderately Responsive";
          else desc = "Needs Attention";

          responsiveness = {
            closedIssuesRatio: ratio,
            sampleSize: totalSample,
            openIssuesCount: openCount,
            issuesUrl: `https://github.com/${owner}/${repo}/issues`,
            description: desc,
          };
        }
      }

      if (advisoriesData && Array.isArray(advisoriesData)) {
        const issues = advisoriesData.map((adv: any) => ({
          summary: adv.summary || "N/A",
          severity: adv.severity || "unknown",
          url: adv.html_url || "",
        }));

        securityAdvisories = {
          critical: issues.filter(
            (i) => i.severity.toLowerCase() === "critical",
          ).length,
          high: issues.filter((i) => i.severity.toLowerCase() === "high")
            .length,
          moderate: issues.filter(
            (i) => i.severity.toLowerCase() === "moderate",
          ).length,
          low: issues.filter((i) => i.severity.toLowerCase() === "low").length,
          issues,
        };
      }
    } catch (e) {
      console.error(
        `[NPM Advisor] Failed to fetch some Github data for ${githubInfo.owner}/${githubInfo.repo}`,
        e,
      );
    }
  } else {
    console.warn(
      `[NPM Advisor] Could not resolve a valid GitHub repository for ${packageName}`,
    );
  }

  function extractRecommendations(raw: any, pkgName: string) {
    if (!raw || !raw.mappings || !raw.mappings[pkgName]) return null;
    const mapping = raw.mappings[pkgName];
    const replacementIds = mapping.replacements || [];

    const replacements = replacementIds
      .map((id: string) => raw.replacements?.[id])
      .filter(Boolean);

    return replacements.length > 0 ? replacements : null;
  }

  const recommendations: PackageStats["recommendations"] = {};

  const nativeMatches = extractRecommendations(
    nativeReplacementsRaw,
    packageName,
  );
  if (nativeMatches) recommendations.nativeReplacements = nativeMatches;

  const microMatches = extractRecommendations(
    microUtilityReplacementsRaw,
    packageName,
  );
  if (microMatches) recommendations.microUtilityReplacements = microMatches;

  const preferredMatches = extractRecommendations(
    preferredReplacementsRaw,
    packageName,
  );
  if (preferredMatches)
    recommendations.preferredReplacements = preferredMatches;

  let score = 0;

  // Reward small bundle size (e.g., under 50kb gzip gets points)
  const gzip = bundle?.gzip || Infinity;
  if (gzip < 50000) score += 10;
  if (gzip < 10000) score += 20;

  // Reward low dependency count
  const deps = dependencyTree
    ? Object.keys(dependencyTree.dependencies || {}).length
    : 0;
  if (deps === 0) score += 30;
  else if (deps < 5) score += 15;

  // Reward native/e18e replacements availability
  const recs = recommendations;
  if (
    recs &&
    (recs.nativeReplacements?.length > 0 ||
      recs.preferredReplacements?.length > 0)
  ) {
    score += 25; // Being recommended is highly weighted
  }

  const stats: PackageStats = {
    packageName,
    githubUrl: githubInfo
      ? `https://github.com/${githubInfo.owner}/${githubInfo.repo}`
      : null,
    stars,
    collaboratorsCount,
    lastCommitDate,
    responsiveness,
    securityAdvisories,
    bundle,
    dependencyTree,
    license: licenseStr,
    licenseCompatibility,
    recommendations,
    score,
  };

  return stats;
}
