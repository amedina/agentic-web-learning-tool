/**
 * Internal dependencies.
 */
import { fetchNpmPackage } from "../utils/fetchNpmPackage";
import { UpstreamFetchError } from "../utils/fetchWithCache";
import { fetchGithubRepo } from "../utils/fetchGithubRepo";
import { fetchGithubIssues } from "../utils/fetchGithubIssues";
import { fetchGithubSecurityAdvisories } from "../utils/fetchGithubSecurityAdvisories";
import { fetchBundlephobiaData } from "../utils/fetchBundlephobiaData";
import { getDependencyTree } from "./getDependencyTree";
import { fetchModuleReplacements } from "../utils/fetchModuleReplacements";
import { githubFetch, GithubRateLimitError } from "../utils/githubFetch";
import { fetchOsvAdvisories } from "../utils/fetchOsvAdvisories";
import { matchesAdvisoryVersion } from "./matchAdvisoryToVersion";
import { checkLicenseCompatibility } from "./checkLicenseCompatibility";
import { parseGithubUrl } from "../utils/parseGithubUrl";
import { extractGithubUrlFromReadme } from "../utils/extractGithubUrlFromReadme";
import { extractRecommendations } from "./extractRecommendations";
import { computeScoreBreakdown } from "./computeScoreBreakdown";
import {
  type PackageStats,
  type GetPackageStatsOptions,
} from "./packageStatsTypes";

export {
  type PackageStats,
  type ScoreBreakdownItem,
  type DependencyCategory,
  type GetPackageStatsOptions,
} from "./packageStatsTypes";

/**
 * Returns true when `url` points at a host other than GitHub (GitLab,
 * Bitbucket, a self-hosted forge, etc.). Used to tell "repository hosted
 * elsewhere" apart from "no repository", so the UI can explain why the
 * GitHub-derived signals are absent. Shorthands like `github:owner/repo`
 * parse with an empty hostname and are not treated as non-GitHub, and
 * subdomains of github.com (e.g. `gist.github.com`) are treated as GitHub.
 */
function isNonGithubRepositoryUrl(url: string | undefined | null): boolean {
  if (!url) {
    return false;
  }
  try {
    const cleanUrl = url.replace(/^git\+/, "").replace(/^git:\/\//, "https://");
    const host = new URL(cleanUrl).hostname.toLowerCase();
    return !!host && host !== "github.com" && !host.endsWith(".github.com");
  } catch {
    return false;
  }
}

/**
 * Get Package Stats.
 */
export async function getPackageStats(
  packageName: string,
  targetLicense: string = "MIT",
  options: GetPackageStatsOptions = {},
): Promise<PackageStats | null> {
  const {
    includeDependencyTree = true,
    includeBundle = true,
    dependencyCategory = "unknown",
    includeGithubIssues = true,
    resolvedVersion,
    signal,
  } = options;

  console.log(
    `[NPM Advisor] Fetching stats for ${packageName}${includeDependencyTree ? "" : " (light)"}${resolvedVersion ? ` @ ${resolvedVersion}` : ""}...`,
  );

  // Set when the bundlephobia request fails for a non-404 reason (rate-limit,
  // server error, timeout). Surfaced on the result so the UI can show a
  // "couldn't fetch" hint and a soft notification instead of an empty card.
  let bundleUnavailable = false;

  const [
    npmData,
    bundleData,
    dependencyTree,
    nativeReplacementsRaw,
    microUtilityReplacementsRaw,
    preferredReplacementsRaw,
    osvAdvisoriesRaw,
  ] = await Promise.all([
    // The npm registry is the one upstream we can't degrade gracefully around:
    // with no packument there are no stats to show. Translate a 429 into a
    // clear, user-facing message so the side panel's error screen tells the
    // user the registry is rate-limiting rather than printing a raw URL.
    fetchNpmPackage(packageName, signal).catch((error) => {
      if (error instanceof UpstreamFetchError && error.isRateLimited) {
        throw new Error(
          "The npm registry is rate-limiting requests right now. Please wait a minute and refresh.",
        );
      }
      throw error;
    }),
    includeBundle
      ? fetchBundlephobiaData(packageName, resolvedVersion, signal).catch(
          (e) => {
            bundleUnavailable = true;
            console.warn(
              `[NPM Advisor] Failed to fetch bundle data for ${packageName}`,
              e,
            );
            return null;
          },
        )
      : Promise.resolve(null),
    includeDependencyTree
      ? getDependencyTree(packageName, "latest", new Set(), 0, signal).catch(
          (e) => {
            console.warn(
              `[NPM Advisor] Failed to fetch dependency tree for ${packageName}`,
              e,
            );
            return null;
          },
        )
      : Promise.resolve(null),
    fetchModuleReplacements("native", signal).catch(() => null),
    fetchModuleReplacements("micro-utilities", signal).catch(() => null),
    fetchModuleReplacements("preferred", signal).catch(() => null),
    // OSV runs unconditionally — it works directly from the npm package
    // name with no GitHub repo lookup needed, so packages whose repository
    // we can't resolve still get advisory coverage.
    fetchOsvAdvisories(packageName, undefined, signal),
  ]);

  console.log({
    nativeReplacementsRaw,
    microUtilityReplacementsRaw,
    preferredReplacementsRaw,
  });

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

  // Pick the version we'll use for version-sensitive lookups. When the caller
  // resolved a version from a lockfile, use that — so license, repository,
  // bundle size, and (later) advisory matching all reflect what's actually
  // installed in the user's project. Otherwise fall back to the latest
  // published version, the existing behaviour.
  const latestVersion = npmData["dist-tags"]?.latest;
  const consideredVersion =
    resolvedVersion && npmData.versions?.[resolvedVersion]
      ? resolvedVersion
      : (latestVersion ?? null);
  const versionResolution: "lockfile" | "latest-fallback" =
    consideredVersion === resolvedVersion && resolvedVersion
      ? "lockfile"
      : "latest-fallback";
  if (resolvedVersion && versionResolution === "latest-fallback") {
    console.warn(
      `[NPM Advisor] resolvedVersion "${resolvedVersion}" not present in npm registry data for "${packageName}"; falling back to latest.`,
    );
  }

  const repoUrlField = consideredVersion
    ? npmData.versions[consideredVersion]?.repository?.url
    : npmData.repository?.url;

  const rawLicense = consideredVersion
    ? npmData.versions[consideredVersion]?.license
    : npmData.license;

  const licenseStr =
    typeof rawLicense === "string" ? rawLicense : rawLicense?.type || null;

  // Treat URL-based license fields as unknown — the raw URL is not a valid
  // SPDX identifier and cannot be used for compatibility checks.
  const isUrlLicense =
    !!licenseStr &&
    (/^https?:\/\//i.test(licenseStr.trim()) ||
      /^see\s+license\s+in/i.test(licenseStr.trim()));

  const licenseCompatibility = checkLicenseCompatibility(
    licenseStr,
    targetLicense,
  );

  // Normalise to null so UI layers uniformly display "Unknown".
  const displayLicense = isUrlLicense ? null : licenseStr;

  let githubInfo = repoUrlField ? parseGithubUrl(repoUrlField) : null;

  // Fallback: some packages (e.g. @rtcamp/frappe-ui-react) ship without a
  // usable `repository.url` field but their `readme` field carries a GitHub
  // link to the source — either as a bare URL string (when the publisher
  // set `readme` in package.json directly) or embedded in the README
  // markdown content that npm publish stores on the registry. Scanning that
  // string for the first plausible github.com/<owner>/<repo> URL is enough
  // to recover the repo identity for the rest of the stats pipeline.
  if (!githubInfo) {
    const readmeField = consideredVersion
      ? npmData.versions[consideredVersion]?.readme
      : null;
    const topLevelReadme = npmData.readme;
    const readmeGithubUrl =
      extractGithubUrlFromReadme(readmeField) ??
      extractGithubUrlFromReadme(topLevelReadme);
    if (readmeGithubUrl) {
      githubInfo = parseGithubUrl(readmeGithubUrl);
    }
  }

  // When we still have no GitHub repo but the package does declare a
  // repository on another host, flag it so the UI can say "hosted elsewhere"
  // rather than leaving the GitHub-signal widgets blank with no explanation.
  const repositoryHostUnsupported =
    !githubInfo && isNonGithubRepositoryUrl(repoUrlField);

  let stars = null;
  let lastCommitDate = null;
  let responsiveness = null;
  let securityAdvisories: PackageStats["securityAdvisories"] = null;
  let githubAdvisoriesData: any[] | null = null;
  let githubAdvisoriesFetchFailed = false;
  // GitHub has separate rate limits per resource. We track the
  // user-actionable one (Core REST API, raised by adding a PAT) on
  // `githubRateLimited`; that's what the toast and Header / Security
  // advisory warnings key off of. The Search API has a much tighter
  // per-minute quota (30 req/min even authenticated) which routinely
  // throttles when scanning many deps in parallel; flagging that as a
  // global "rate limit reached" was misleading — there's no PAT-able
  // fix and the toast/warning suggested the whole scan was broken when
  // typically only one or two deps' issue samples were affected. We
  // keep the search-specific signal in its own flag so the
  // Responsiveness widget can show a softer "couldn't fetch right now"
  // hint without claiming a global rate limit.
  let githubRateLimited = false;
  let githubIssuesUnavailable = false;

  if (githubInfo) {
    try {
      const { owner, repo } = githubInfo;

      // Core API failures (repo / advisories) flip `githubRateLimited`.
      // Search API failures (issues) flip the issues-specific flag for any
      // error — not just GithubRateLimitError — because GitHub's secondary
      // rate limit (triggered when the Report tab fans out fetchGithubIssues
      // across many deps) returns 403 without x-ratelimit-remaining:0, so it
      // doesn't qualify as GithubRateLimitError but still means the data is
      // temporarily unavailable. Without this, the widget shows "Not enough
      // data to determine" instead of "Couldn't fetch right now."
      const swallowGithubError =
        (label: string, isSearchApi = false) =>
        (error: unknown) => {
          if (error instanceof GithubRateLimitError) {
            if (isSearchApi) {
              githubIssuesUnavailable = true;
            } else {
              githubRateLimited = true;
            }
          } else {
            if (isSearchApi) {
              githubIssuesUnavailable = true;
            }
            console.warn(
              `[NPM Advisor] ${label} fetch failed:`,
              (error as Error)?.message,
            );
          }
          return null;
        };

      const [repoData, issuesData, advisoriesData] = await Promise.all([
        fetchGithubRepo(owner, repo, signal).catch(
          swallowGithubError("GitHub Repo"),
        ),
        includeGithubIssues
          ? fetchGithubIssues(owner, repo, signal).catch(
              swallowGithubError("GitHub Issues", true),
            )
          : Promise.resolve(null),
        fetchGithubSecurityAdvisories(owner, repo, signal).catch(
          (error: unknown) => {
            // Track failure separately from the swallow helper so the merge
            // step below can distinguish "github said nothing" (counts as a
            // contributing source) from "github fetch failed" (don't list it
            // as a source so the UI can warn about partial coverage).
            githubAdvisoriesFetchFailed = true;
            if (error instanceof GithubRateLimitError) {
              githubRateLimited = true;
            } else {
              console.warn(
                `[NPM Advisor] GitHub Advisories fetch failed:`,
                (error as Error)?.message,
              );
            }
            return null;
          },
        ),
      ]);

      if (repoData && repoData.repo) {
        stars = repoData.repo.stars;
        lastCommitDate = repoData.repo.pushedAt || repoData.repo.updatedAt;
      }

      const issuesList = issuesData?.items ?? null;

      // GitHub silently returns { total_count: 0, items: [] } with HTTP 200
      // under secondary rate-limiting. Cross-check against the repo's
      // open_issues_count so we can surface "Couldn't fetch" instead of the
      // misleading "Not enough data to determine."
      if (
        includeGithubIssues &&
        !githubIssuesUnavailable &&
        (!issuesList || issuesList.length === 0)
      ) {
        const ghRepo = await githubFetch(
          `https://api.github.com/repos/${owner}/${repo}`,
        ).catch(() => null);
        if (
          ghRepo &&
          (ghRepo as any).has_issues &&
          (ghRepo as any).open_issues_count > 0
        ) {
          githubIssuesUnavailable = true;
        }
      }

      if (issuesList && Array.isArray(issuesList) && issuesList.length > 0) {
        const totalSample = issuesList.length;
        const closedCount = issuesList.filter(
          (issue: any) => issue.state === "closed",
        ).length;
        const ratio = closedCount / totalSample;
        let desc = "Unknown";
        if (ratio > 0.8) desc = "Highly Responsive";
        else if (ratio > 0.5) desc = "Moderately Responsive";
        else desc = "Needs Attention";

        // Use the true total open count from the dedicated `is:open` query;
        // fall back to the sample count if unavailable.
        const openIssuesCount =
          issuesData?.openTotalCount ??
          issuesList.filter((issue: any) => issue.state === "open").length;

        responsiveness = {
          closedIssuesRatio: ratio,
          sampleSize: totalSample,
          openIssuesCount,
          issuesUrl: `https://github.com/${owner}/${repo}/issues`,
          description: desc,
        };
      }

      if (advisoriesData && Array.isArray(advisoriesData)) {
        githubAdvisoriesData = advisoriesData;
      }
    } catch (e) {
      // Per-fetch errors are already swallowed by `swallowGithubError`. This
      // outer catch only triggers if something synchronous in the GitHub
      // block threw, which we don't want to be fatal either — flag it as a
      // rate-limit for any GithubRateLimitError that escaped, otherwise log.
      if (e instanceof GithubRateLimitError) {
        githubRateLimited = true;
      } else {
        console.error(
          `[NPM Advisor] Failed to fetch some Github data for ${githubInfo.owner}/${githubInfo.repo}`,
          e,
        );
      }
    }
  } else {
    console.warn(
      `[NPM Advisor] Could not resolve a valid GitHub repository for ${packageName}`,
    );
  }

  // Merge GitHub + OSV advisories into one list, deduplicated by canonical
  // identifier (GHSA id or CVE alias). When both feeds list the same
  // finding we keep GitHub's record because its severity field is
  // pre-bucketed (critical / high / moderate / low) and consistent with
  // the rest of the UI's labels. OSV-only findings are added with the
  // severity derived in `fetchOsvAdvisories`.
  const advisorySources: Array<"github" | "osv"> = [];
  // GitHub counts as a contributing source whenever we successfully
  // reached the API for a known repo, even if it returned no findings —
  // that's still useful information. Skip when there's no repo to query
  // against and when the fetch threw or rate-limited.
  if (githubInfo && !githubAdvisoriesFetchFailed && !githubRateLimited) {
    advisorySources.push("github");
  }
  // OSV now returns `null` when unreachable (distinct from `[]` for a genuine
  // empty result). A non-empty list is still the signal that OSV contributed
  // findings to the merged list below; the unreachable case feeds
  // `advisoryCoverageDegraded` so the UI can warn that coverage was partial.
  const osvUnavailable = osvAdvisoriesRaw === null;
  const osvRecords = osvAdvisoriesRaw ?? [];
  if (osvRecords.length > 0) {
    advisorySources.push("osv");
  }

  // Advisory coverage is degraded when a source we'd normally consult failed:
  // OSV unreachable, or (for a known repo) GitHub advisories errored or were
  // rate-limited. Lets the UI flag that "no advisories" may mean "not fully
  // checked" rather than "known clean".
  const advisoryCoverageDegraded =
    osvUnavailable ||
    (!!githubInfo && (githubAdvisoriesFetchFailed || githubRateLimited));

  const githubList = githubAdvisoriesData ?? [];
  const mergedAdvisories: any[] = githubList.slice();
  const seenIds = new Set<string>();
  for (const advisory of githubList) {
    const ghsaId = advisory?.ghsa_id;
    if (typeof ghsaId === "string" && ghsaId.length > 0) {
      seenIds.add(ghsaId.toLowerCase());
    }
    const aliases = Array.isArray(advisory?.identifiers)
      ? advisory.identifiers
      : [];
    for (const alias of aliases) {
      if (
        alias &&
        typeof alias === "object" &&
        typeof alias.value === "string"
      ) {
        seenIds.add(alias.value.toLowerCase());
      }
    }
  }
  for (const osvAdvisory of osvRecords) {
    const matchesExisting = osvAdvisory.canonicalIds.some((id) =>
      seenIds.has(id),
    );
    if (matchesExisting) {
      continue;
    }
    for (const id of osvAdvisory.canonicalIds) {
      seenIds.add(id);
    }
    mergedAdvisories.push(osvAdvisory);
  }

  if (mergedAdvisories.length > 0) {
    // Apply the version-aware filter to the merged list. OSV is already
    // server-side filtered when a version was passed, but the helper is
    // a no-op for records whose vulnerabilities already match — so this
    // is the single source of truth regardless of which feed produced
    // the record.
    const relevant = mergedAdvisories.filter((adv) =>
      matchesAdvisoryVersion(adv, packageName, consideredVersion),
    );

    if (relevant.length > 0) {
      const issues = relevant.map((adv) => ({
        summary: adv.summary || "N/A",
        severity: typeof adv.severity === "string" ? adv.severity : "unknown",
        url: adv.html_url || "",
      }));

      securityAdvisories = {
        critical: issues.filter((i) => i.severity.toLowerCase() === "critical")
          .length,
        high: issues.filter((i) => i.severity.toLowerCase() === "high").length,
        moderate: issues.filter((i) => i.severity.toLowerCase() === "moderate")
          .length,
        low: issues.filter((i) => i.severity.toLowerCase() === "low").length,
        issues,
      };
    }
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

  const { scoreBreakdown, score, scoreMaxPoints } = computeScoreBreakdown({
    bundle,
    dependencyCategory,
    includeBundle,
    dependencyTree,
    includeDependencyTree,
    consideredVersion,
    npmData,
    responsiveness,
    githubIssuesUnavailable,
    githubRateLimited,
    securityAdvisories,
  });

  const stats: PackageStats = {
    packageName,
    description: npmData.description || null,
    latestVersion: latestVersion ?? null,
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
    license: displayLicense,
    licenseCompatibility,
    recommendations,
    score,
    scoreBreakdown,
    scoreMaxPoints,
    githubRateLimited,
    githubIssuesUnavailable,
    bundleUnavailable,
    repositoryHostUnsupported,
    advisoryCoverageDegraded,
    versionResolution,
    consideredVersion,
    advisorySources,
  };

  return stats;
}
