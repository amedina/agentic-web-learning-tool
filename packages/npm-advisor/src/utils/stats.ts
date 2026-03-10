/**
 * Internal dependencies.
 */
import {
  fetchNpmPackage,
  fetchGithubRepo,
  fetchGithubIssues,
  fetchGithubCommits,
} from "./api";

export interface PackageStats {
  packageName: string;
  githubUrl: string | null;
  stars: number | null;
  maintainersCount: number | null;
  lastCommitDate: string | null;
  responsiveness: {
    closedIssuesRatio: number | null;
    sampleSize: number;
    description: string;
  } | null;
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

  const npmData = await fetchNpmPackage(packageName);
  if (!npmData) {
    console.warn(`[NPM Advisor] Could not find NPM data for ${packageName}`);
    return null;
  }

  const maintainersCount = npmData.maintainers?.length || null;

  // Extract repo URL from latest version or repository field
  const latestVersion = npmData["dist-tags"]?.latest;
  const repoUrlField = latestVersion
    ? npmData.versions[latestVersion]?.repository?.url
    : npmData.repository?.url;

  const githubInfo = repoUrlField ? parseGithubUrl(repoUrlField) : null;

  let stars = null;
  let lastCommitDate = null;
  let responsiveness = null;

  if (githubInfo) {
    try {
      const { owner, repo } = githubInfo;

      const [repoData, commitsData, issuesData] = await Promise.all([
        fetchGithubRepo(owner, repo),
        fetchGithubCommits(owner, repo),
        fetchGithubIssues(owner, repo),
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

  const stats: PackageStats = {
    packageName,
    githubUrl: githubInfo
      ? `https://github.com/${githubInfo.owner}/${githubInfo.repo}`
      : null,
    stars,
    maintainersCount,
    lastCommitDate,
    responsiveness,
  };

  return stats;
}
