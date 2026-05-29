/**
 * Internal dependencies.
 */
import { type DependencyTree } from "./getDependencyTree";
import {
  type PackageStats,
  type ScoreBreakdownItem,
  type DependencyCategory,
} from "./packageStatsTypes";

/**
 * Inputs the scorer reads to compute the per-axis breakdown. These mirror the
 * locals `getPackageStats` has already resolved by the time it scores, so the
 * scorer stays a pure function of already-fetched data.
 */
export interface ScoreBreakdownInput {
  bundle: PackageStats["bundle"];
  dependencyCategory: DependencyCategory;
  includeBundle: boolean;
  dependencyTree: DependencyTree | null;
  includeDependencyTree: boolean;
  consideredVersion: string | null;
  npmData: any;
  responsiveness: PackageStats["responsiveness"];
  githubIssuesUnavailable: boolean;
  githubRateLimited: boolean;
  securityAdvisories: PackageStats["securityAdvisories"];
}

/**
 * The score and its supporting breakdown, ready to be spread onto the
 * `PackageStats` result.
 */
export interface ScoreBreakdownResult {
  scoreBreakdown: ScoreBreakdownItem[];
  score: number;
  scoreMaxPoints: number;
}

/**
 * Computes the package quality score from three weighted axes (bundle size,
 * dependency count, maintainer responsiveness) plus a security-advisory
 * penalty.
 *
 * Score is computed from three weighted axes summing to 100 when every axis is
 * scored. Each axis is also written to `scoreBreakdown` so the UI can show the
 * user how the score was arrived at, including any axes that were skipped
 * because the underlying data was unavailable.
 *
 * Note: the e18e "modern replacements" list is intentionally not part of the
 * score. Whether a replacement exists is a property of the ecosystem around
 * the package, not of the package itself, so rewarding or penalising it
 * conflates "this has alternatives" with "this is good/bad". The
 * Recommendations widget still surfaces that guidance to the user.
 */
export function computeScoreBreakdown(
  input: ScoreBreakdownInput,
): ScoreBreakdownResult {
  const {
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
  } = input;

  const scoreBreakdown: ScoreBreakdownItem[] = [];

  // Axis 1: bundle size (max 45). Rewards smaller gzipped payloads —
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
    bundlePoints = 45;
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
    maxPoints: 45,
    reason: bundleReason,
    status: bundleStatus,
  });

  // Axis 2: dependency count (max 35). Rewards leaf packages with no or few
  // direct dependencies — a proxy for supply-chain surface area. When we
  // skipped the transitive tree fetch, fall back to the top-level deps
  // declared on the published version so the axis still contributes
  // without triggering a recursive npm fetch.
  let deps: number;
  if (dependencyTree) {
    deps = Object.keys(dependencyTree.dependencies || {}).length;
  } else if (!includeDependencyTree) {
    const topLevelDeps = consideredVersion
      ? npmData.versions[consideredVersion]?.dependencies
      : undefined;
    deps = topLevelDeps ? Object.keys(topLevelDeps).length : 0;
  } else {
    deps = 0;
  }
  let depsPoints = 0;
  let depsReason: string;
  if (deps === 0) {
    depsPoints = 35;
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
    maxPoints: 35,
    reason: depsReason,
    status: "scored",
  });

  // Axis 3: maintainer responsiveness (max 20). Scaled linearly from the
  // sampled closed-issues ratio: ratio of 1.0 awards the full 20 points,
  // 0.5 awards 10, and so on. Capped lower than bundle / deps because the
  // closed-issues sample is a coarse proxy — old issues that closed via
  // staleness inflate the ratio, and small repos with few issues swing
  // wildly — so the axis shouldn't drag the score the way bundle size or
  // dependency surface area legitimately can. Marked unavailable when the
  // package has no linked GitHub repo or no issues sample, so packages
  // without a public repo aren't penalised for a missing signal.
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
    responsivenessPoints = Math.round(closedRatio * 20);
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
    maxPoints: 20,
    reason: responsivenessReason,
    status: responsivenessStatus,
  });

  // Penalty axis: security advisories. Contributes only negative points
  // so the numerator drops without inflating the denominator. Weights are
  // intentionally light — advisories are temporary (patches land, the
  // GitHub feed clears) and shouldn't dominate a long-term quality signal.
  // The vulnerability indicator next to the score is what draws the user's
  // eye; this penalty is just a nudge so a heavily-advised package can't
  // tie a clean one on score alone.
  if (securityAdvisories) {
    const { critical, high, moderate, low } = securityAdvisories;
    const total = critical + high + moderate + low;
    if (total > 0) {
      const rawPenalty = critical * 5 + high * 3 + moderate * 2 + low * 1;
      const cappedPenalty = Math.min(rawPenalty, 15);
      const severityParts: string[] = [];
      if (critical > 0) {
        severityParts.push(`${critical} critical`);
      }
      if (high > 0) {
        severityParts.push(`${high} high`);
      }
      if (moderate > 0) {
        severityParts.push(`${moderate} moderate`);
      }
      if (low > 0) {
        severityParts.push(`${low} low`);
      }
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

  return { scoreBreakdown, score, scoreMaxPoints };
}
