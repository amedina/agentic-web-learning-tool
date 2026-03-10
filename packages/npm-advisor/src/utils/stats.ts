/**
 * Internal dependencies.
 */
import {
  fetchNpmPackage,
  fetchGithubRepo,
  fetchGithubIssues,
  fetchGithubCommits,
  fetchGithubSecurityAdvisories,
  fetchBundlephobiaData,
  getDependencyTree,
  fetchModuleReplacements,
} from "./api";
import type { DependencyTree } from "./api";
import { checkLicenseCompatibility } from "./license";
import type { LicenseCompatibilityResult } from "./license";

export interface PackageStats {
  packageName: string;
  githubUrl: string | null;
  stars: number | null;
  collaboratorsCount: number | null;
  lastCommitDate: string | null;
  responsiveness: {
    closedIssuesRatio: number | null;
    sampleSize: number;
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
}

export function parseGithubUrl(
  url: string,
): { owner: string; repo: string } | null {
  if (!url) return null;
  try {
    // Handle formats like: git+https://github.com/axios/axios.git, https://github.com/axios/axios, git://github.com/...
    let cleanUrl = url.replace(/^git\+/, "").replace(/^git:\/\//, "https://");
    const parsed = new URL(cleanUrl);
    if (parsed.hostname === "github.com") {
      const pathParts = parsed.pathname.split("/").filter((p) => p && p !== "");
      if (pathParts.length >= 2) {
        let repo = pathParts[1];
        if (repo.endsWith(".git")) {
          repo = repo.slice(0, -4);
        }
        return { owner: pathParts[0], repo };
      }
    }
  } catch (e) {
    console.error("Failed to parse Github URL", url, e);
  }
  return null;
}

export async function getPackageStats(
  packageName: string,
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
  const licenseCompatibility = checkLicenseCompatibility(licenseStr);

  const githubInfo = repoUrlField ? parseGithubUrl(repoUrlField) : null;

  let stars = null;
  let lastCommitDate = null;
  let responsiveness = null;
  let securityAdvisories = null;

  if (githubInfo) {
    try {
      const { owner, repo } = githubInfo;

      const [repoData, commitsData, issuesData, advisoriesData] =
        await Promise.all([
          fetchGithubRepo(owner, repo),
          fetchGithubCommits(owner, repo),
          fetchGithubIssues(owner, repo),
          fetchGithubSecurityAdvisories(owner, repo),
        ]);

      if (repoData) {
        stars = repoData.stargazers_count;
      }

      if (commitsData && commitsData.length > 0) {
        lastCommitDate = commitsData[0].commit.author.date;
      }

      if (issuesData && Array.isArray(issuesData)) {
        const totalSample = issuesData.length;
        if (totalSample > 0) {
          const closedCount = issuesData.filter(
            (issue) => issue.state === "closed",
          ).length;
          const ratio = closedCount / totalSample;
          let desc = "Unknown";
          if (ratio > 0.8) desc = "Highly Responsive";
          else if (ratio > 0.5) desc = "Moderately Responsive";
          else desc = "Needs Attention";

          responsiveness = {
            closedIssuesRatio: ratio,
            sampleSize: totalSample,
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
  };

  return stats;
}
