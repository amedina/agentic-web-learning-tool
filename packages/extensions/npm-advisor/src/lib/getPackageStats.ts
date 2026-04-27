/**
 * Internal dependencies.
 */
import { fetchNpmPackage } from "../utils/fetchNpmPackage";
import { fetchGithubRepo } from "../utils/fetchGithubRepo";
import { fetchGithubIssues } from "../utils/fetchGithubIssues";
import { fetchGithubSecurityAdvisories } from "../utils/fetchGithubSecurityAdvisories";
import { fetchBundlephobiaData } from "../utils/fetchBundlephobiaData";
import { getDependencyTree, type DependencyTree } from "./getDependencyTree";
import { fetchModuleReplacements } from "../utils/fetchModuleReplacements";
import { GithubRateLimitError } from "../utils/githubFetch";

/**
 * External dependencies.
 */
import {
  checkLicenseCompatibility,
  type LicenseCompatibilityResult,
} from "./checkLicenseCompatibility";
import { parseGithubUrl } from "../utils/parseGithubUrl";

export interface PackageStats {
  packageName: string;
  description: string | null;
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
  scoreBreakdown: ScoreBreakdownItem[];
  scoreMaxPoints: number;
  /**
   * True when a GitHub Core REST API call (repo metadata, security
   * advisories) failed due to a rate limit — i.e. the kind of failure
   * adding a Personal Access Token would mitigate. Drives the toast and
   * the Header / SecurityAdvisories warning indicators.
   */
  githubRateLimited: boolean;
  /**
   * True when the GitHub Search API call used to gather issue activity
   * was throttled. Tracked separately because Search has a much tighter
   * per-minute quota (30 req/min even authenticated) that routinely
   * trips during a multi-dep scan and is not user-actionable. We render
   * a softer "couldn't fetch right now" hint on the Responsiveness
   * widget rather than the alarming global rate-limit warning.
   */
  githubIssuesUnavailable: boolean;
}

export interface ScoreBreakdownItem {
  label: string;
  points: number;
  maxPoints: number;
  reason: string;
  /**
   * - `scored`: the axis was evaluated; both `points` and `maxPoints`
   *   contribute to the displayed score.
   * - `unavailable`: required data was missing so the axis was skipped.
   *   It contributes 0 to the numerator AND 0 to the denominator, so the
   *   package isn't unfairly penalized for a data gap.
   * - `penalty`: the axis only deducts from the score. `points` is
   *   negative, `maxPoints` is 0, so the denominator is unaffected but the
   *   numerator drops. Used for things like security advisories where the
   *   signal is strictly a downside, never an upside.
   */
  status: "scored" | "unavailable" | "penalty";
}

/**
 * How the package is consumed in the user's project. The scorer uses this
 * to pick which axes apply — a dev-only tool (like TypeScript) shouldn't
 * be penalised for bundle size because it never ships to end users.
 *
 * - `runtime`: declared under `dependencies` or `peerDependencies`; ships
 *   to end users. Bundle size matters.
 * - `dev`: declared under `devDependencies`; never shipped. Bundle size
 *   and dep-count axes are marked unavailable.
 * - `unknown` (default): we don't know the consumption context (e.g. the
 *   user is viewing a standalone npm package page). Assume frontend use
 *   so the score reflects "how fit for a client-side bundle is this?".
 */
export type DependencyCategory = "runtime" | "dev" | "unknown";

export interface GetPackageStatsOptions {
  /**
   * Whether to resolve the full transitive dependency tree. Skipping the tree
   * avoids the recursive npm fetch cost when analysing many packages at once
   * (e.g. the Report tab's dependency list).
   */
  includeDependencyTree?: boolean;
  /**
   * Whether to fetch bundlephobia data for this package. Skipping it cuts a
   * network round-trip per dep, which matters when the Report tab fans out
   * to dozens of packages and most never get expanded. The Bundle Size
   * scoring axis is then marked unavailable (with a "deferred" reason) until
   * the caller fetches the bundle separately via `fetchBundlephobiaData`.
   */
  includeBundle?: boolean;
  /**
   * How this package is consumed in the user's project, if known. Defaults
   * to `unknown`, which scores as if the package will be shipped to a
   * client-side bundle.
   */
  dependencyCategory?: DependencyCategory;
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
  } = options;

  console.log(
    `[NPM Advisor] Fetching stats for ${packageName}${includeDependencyTree ? "" : " (light)"}...`,
  );

  const [
    npmData,
    bundleData,
    dependencyTree,
    nativeReplacementsRaw,
    microUtilityReplacementsRaw,
    preferredReplacementsRaw,
  ] = await Promise.all([
    fetchNpmPackage(packageName),
    includeBundle
      ? fetchBundlephobiaData(packageName).catch((e) => {
          console.warn(
            `[NPM Advisor] Failed to fetch bundle data for ${packageName}`,
            e,
          );
          return null;
        })
      : Promise.resolve(null),
    includeDependencyTree
      ? getDependencyTree(packageName).catch((e) => {
          console.warn(
            `[NPM Advisor] Failed to fetch dependency tree for ${packageName}`,
            e,
          );
          return null;
        })
      : Promise.resolve(null),
    fetchModuleReplacements("native").catch(() => null),
    fetchModuleReplacements("micro-utilities").catch(() => null),
    fetchModuleReplacements("preferred").catch(() => null),
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

  const githubInfo = repoUrlField ? parseGithubUrl(repoUrlField) : null;

  let stars = null;
  let lastCommitDate = null;
  let responsiveness = null;
  let securityAdvisories = null;
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
        fetchGithubRepo(owner, repo).catch(swallowGithubError("GitHub Repo")),
        fetchGithubIssues(owner, repo).catch(
          swallowGithubError("GitHub Issues", true),
        ),
        fetchGithubSecurityAdvisories(owner, repo).catch(
          swallowGithubError("GitHub Advisories"),
        ),
      ]);

      if (repoData && repoData.repo) {
        stars = repoData.repo.stars;
        lastCommitDate = repoData.repo.pushedAt || repoData.repo.updatedAt;
      }

      const issuesList = issuesData?.items ?? null;

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

  // Score is computed from three weighted axes summing to 100 when every
  // axis is scored. Each axis is also written to `scoreBreakdown` so the
  // UI can show the user how the score was arrived at, including any
  // axes that were skipped because the underlying data was unavailable.
  //
  // Note: the e18e "modern replacements" list is intentionally not part of
  // the score. Whether a replacement exists is a property of the ecosystem
  // around the package, not of the package itself, so rewarding or
  // penalising it conflates "this has alternatives" with "this is good/bad".
  // The Recommendations widget still surfaces that guidance to the user.
  const scoreBreakdown: ScoreBreakdownItem[] = [];

  // Axis 1: bundle size (max 40). Rewards smaller gzipped payloads —
  // weighted highest because bundle size is the most direct user-facing
  // cost (download, parse, execute). Marked unavailable when:
  //   - the caller asked us to skip the bundlephobia fetch (deferred until
  //     the user expands an accordion row), or
  //   - bundlephobia did not return data, so we can't measure it, or
  //   - the package is declared under devDependencies and so never ships
  //     to end users (a dev-only tool like TypeScript shouldn't be
  //     penalised for being large).
  const gzip = bundle?.gzip ?? null;
  let bundlePoints = 0;
  let bundleReason: string;
  let bundleStatus: ScoreBreakdownItem["status"] = "scored";
  if (dependencyCategory === "dev") {
    bundleReason = "Dev-only package — bundle size does not ship to users";
    bundleStatus = "unavailable";
  } else if (!includeBundle) {
    bundleReason = "Bundle data deferred — expand the row to fetch";
    bundleStatus = "unavailable";
  } else if (gzip === null) {
    bundleReason = "Bundle data not available";
    bundleStatus = "unavailable";
  } else if (gzip < 10000) {
    bundlePoints = 40;
    bundleReason = "Gzipped size under 10 KB";
  } else if (gzip < 50000) {
    bundlePoints = 15;
    bundleReason = "Gzipped size under 50 KB";
  } else {
    bundleReason = "Gzipped size of 50 KB or more";
  }
  scoreBreakdown.push({
    label: "Bundle Size",
    points: bundlePoints,
    maxPoints: 40,
    reason: bundleReason,
    status: bundleStatus,
  });

  // Axis 2: dependency count (max 30). Rewards leaf packages with no or few
  // direct dependencies — a proxy for supply-chain surface area. When we
  // skipped the transitive tree fetch, fall back to the top-level deps
  // declared on the published version so the axis still contributes
  // without triggering a recursive npm fetch.
  let deps: number;
  if (dependencyTree) {
    deps = Object.keys(dependencyTree.dependencies || {}).length;
  } else if (!includeDependencyTree) {
    const topLevelDeps = latestVersion
      ? npmData.versions[latestVersion]?.dependencies
      : undefined;
    deps = topLevelDeps ? Object.keys(topLevelDeps).length : 0;
  } else {
    deps = 0;
  }
  let depsPoints = 0;
  let depsReason: string;
  if (deps === 0) {
    depsPoints = 30;
    depsReason = "No direct dependencies";
  } else if (deps < 5) {
    depsPoints = 15;
    depsReason = `Only ${deps} direct ${deps === 1 ? "dependency" : "dependencies"}`;
  } else {
    depsReason = `${deps} direct dependencies`;
  }
  scoreBreakdown.push({
    label: "Dependencies",
    points: depsPoints,
    maxPoints: 30,
    reason: depsReason,
    status: "scored",
  });

  // Axis 3: maintainer responsiveness (max 30). Scaled linearly from the
  // sampled closed-issues ratio: ratio of 1.0 awards the full 30 points,
  // 0.5 awards 15, and so on. Marked unavailable when the package has no
  // linked GitHub repo or no issues sample, so packages without a public
  // repo aren't penalised for a missing signal.
  let responsivenessPoints = 0;
  let responsivenessReason: string;
  let responsivenessStatus: ScoreBreakdownItem["status"] = "scored";
  const closedRatio = responsiveness?.closedIssuesRatio ?? null;
  if (!responsiveness || closedRatio === null) {
    if (githubIssuesUnavailable || githubRateLimited) {
      responsivenessReason = "Couldn't fetch issue activity right now";
    } else {
      responsivenessReason = "Issue activity not available";
    }
    responsivenessStatus = "unavailable";
  } else {
    responsivenessPoints = Math.round(closedRatio * 30);
    const percentage = Math.round(closedRatio * 100);
    if (closedRatio > 0.8) {
      responsivenessReason = `Highly responsive — ${percentage}% of sampled issues closed`;
    } else if (closedRatio > 0.5) {
      responsivenessReason = `Moderately responsive — ${percentage}% of sampled issues closed`;
    } else {
      responsivenessReason = `Low issue closure rate — ${percentage}% of sampled issues closed`;
    }
  }
  scoreBreakdown.push({
    label: "Responsiveness",
    points: responsivenessPoints,
    maxPoints: 30,
    reason: responsivenessReason,
    status: responsivenessStatus,
  });

  // Penalty axis: security advisories. Contributes only negative points
  // so the numerator drops without inflating the denominator. Points are
  // weighted by severity (critical > high > moderate > low) and capped so
  // a long tail of low-severity advisories can't dominate the score.
  if (securityAdvisories) {
    const { critical, high, moderate, low } = securityAdvisories;
    const total = critical + high + moderate + low;
    if (total > 0) {
      const rawPenalty = critical * 15 + high * 10 + moderate * 5 + low * 2;
      const cappedPenalty = Math.min(rawPenalty, 50);
      const severityParts: string[] = [];
      if (critical > 0) severityParts.push(`${critical} critical`);
      if (high > 0) severityParts.push(`${high} high`);
      if (moderate > 0) severityParts.push(`${moderate} moderate`);
      if (low > 0) severityParts.push(`${low} low`);
      scoreBreakdown.push({
        label: "Security Advisories",
        points: -cappedPenalty,
        maxPoints: 0,
        reason: `${total} open ${total === 1 ? "advisory" : "advisories"} (${severityParts.join(", ")})`,
        status: "penalty",
      });
    }
  }

  // Only `scored` axes contribute to the max denominator. `penalty` axes
  // only reduce the numerator; `unavailable` axes contribute nothing.
  // The final score is clamped to [0, max] so a heavily-advisory'd
  // package shows "0 / N" rather than a negative number.
  const rawScore = scoreBreakdown.reduce((sum, item) => {
    if (item.status === "scored" || item.status === "penalty") {
      return sum + item.points;
    }
    return sum;
  }, 0);
  const scoreMaxPoints = scoreBreakdown.reduce(
    (sum, item) => (item.status === "scored" ? sum + item.maxPoints : sum),
    0,
  );
  const score = Math.max(0, Math.min(rawScore, scoreMaxPoints));

  const stats: PackageStats = {
    packageName,
    description: npmData.description || null,
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
  };

  return stats;
}
