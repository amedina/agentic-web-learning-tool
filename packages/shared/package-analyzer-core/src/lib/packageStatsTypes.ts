/**
 * Internal dependencies.
 */
import { type DependencyTree } from "./getDependencyTree";
import { type LicenseCompatibilityResult } from "./checkLicenseCompatibility";

export interface PackageStats {
  packageName: string;
  description: string | null;
  /** Latest version published to the npm registry, taken from dist-tags.latest. */
  latestVersion: string | null;
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
  /**
   * True when the bundlephobia request for this package failed for a reason
   * other than a benign 404 (rate-limit, server error, timeout, network). The
   * Bundle footprint widget shows an inline "couldn't fetch" hint and the side
   * panel raises a soft notification, instead of silently rendering an empty
   * card as if the package simply had no bundle data.
   */
  bundleUnavailable: boolean;
  /**
   * True when the package declares a repository hosted somewhere other than
   * GitHub (GitLab, Bitbucket, a self-hosted forge, etc.), so the
   * GitHub-derived signals (stars, responsiveness, GitHub advisories) are
   * unavailable by design rather than simply missing. Distinguished from "no
   * repository at all" so the UI can explain the gap instead of showing a bare
   * "not enough data".
   */
  repositoryHostUnsupported: boolean;
  /**
   * True when advisory coverage is degraded: at least one advisory source we
   * would normally consult (OSV, or GitHub's advisories for a known repo)
   * failed or was rate-limited. Lets the UI warn that "no advisories" may mean
   * "not fully checked" rather than "known clean". See {@link advisorySources}
   * for which sources actually contributed.
   */
  advisoryCoverageDegraded: boolean;
  /**
   * How the version used for version-sensitive lookups (npm registry
   * metadata, bundle size, and — once Task 1b lands — advisory matching)
   * was determined.
   * - `"lockfile"`: the caller passed `resolvedVersion`, so the stats
   *   reflect the version actually installed in the user's project.
   * - `"latest-fallback"`: no `resolvedVersion` was provided, so the
   *   latest published version was used. The UI should warn that
   *   advisories may not match what the user has installed.
   */
  versionResolution: "lockfile" | "latest-fallback";
  /**
   * The version against which version-sensitive lookups were performed
   * (`resolvedVersion` when set, otherwise the latest published version).
   * Mirrors what the user actually saw the stats for and is useful for
   * "showing data for X" badges in the UI.
   */
  consideredVersion: string | null;
  /**
   * Advisory data sources that contributed to `securityAdvisories`. When
   * either feed is unreachable (network failure, rate-limit) the missing
   * entry is dropped so the UI can warn that coverage is partial. Empty
   * when `securityAdvisories` itself is `null` (no GitHub repo, no OSV
   * data) — distinguishes "no advisories" from "advisories not checked".
   */
  advisorySources: Array<"github" | "osv">;
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
   * Whether to fetch GitHub issue activity for the Responsiveness widget.
   * Skipping it avoids draining the GitHub Search API quota when scanning many
   * deps in parallel (e.g. Report tab). Default true; set false in light-stats
   * calls that only need bundle / dep-tree data.
   */
  includeGithubIssues?: boolean;
  /**
   * How this package is consumed in the user's project, if known. Defaults
   * to `unknown`, which scores as if the package will be shipped to a
   * client-side bundle.
   */
  dependencyCategory?: DependencyCategory;
  /**
   * The exact version installed in the user's project, as resolved from a
   * lockfile. When provided, npm registry metadata (license, repository,
   * dependencies), bundle-size lookups, and (in Task 1b) advisory
   * matching are performed against this version rather than the latest
   * published one. Surfaces as `versionResolution: "lockfile"` on the
   * result. When omitted, the latest published version is used and the
   * result is flagged `versionResolution: "latest-fallback"` so the UI
   * can warn the user that the verdict may not reflect their install.
   */
  resolvedVersion?: string;
  /**
   * Optional {@link AbortSignal} that cancels every in-flight sub-fetch
   * this analyzer kicks off. Aborting mid-run rejects the outer
   * `getPackageStats` promise with the signal's reason. The shared
   * fetch caches (`fetchWithCache`, `githubFetch`, `fetchOsvAdvisories`)
   * isolate cancellation so any concurrent caller waiting on the same
   * URL keeps its result — only this call short-circuits.
   */
  signal?: AbortSignal;
}
