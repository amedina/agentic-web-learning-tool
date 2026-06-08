/**
 * External dependencies.
 */
import { toast } from "@agentic-web-labs/design-system";
import { type PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { showGithubRateLimitToastOnce } from "./githubRateLimitToast";

export const GITHUB_ISSUES_UNAVAILABLE_MESSAGE =
  "GitHub limited the issue-activity lookup (its search quota is tight). Some responsiveness data is missing; try refreshing in a minute.";

export const BUNDLE_UNAVAILABLE_MESSAGE =
  "Couldn't fetch bundle size from bundlephobia (it may be rate-limited or down). Try refreshing shortly.";

export const ADVISORY_COVERAGE_DEGRADED_MESSAGE =
  'Couldn\'t fully check security advisories (a source was unavailable). "No advisories" may be incomplete; try refreshing.';

// Module-scoped so each soft notice fires at most once per sidepanel session,
// no matter how many packages or dependency rows trip the same limit during a
// scan. Mirrors the guard used by `showGithubRateLimitToastOnce`.
let issuesToastShown = false;
let bundleToastShown = false;
let advisoryCoverageToastShown = false;

/**
 * Surfaces a soft, non-actionable notice that GitHub's Search API throttled
 * the issue-activity lookup. Unlike the Core rate-limit toast there's no PAT
 * fix, so this is a `warning` with no action button and fires only once.
 */
export function showGithubIssuesUnavailableToastOnce(): void {
  if (issuesToastShown) {
    return;
  }
  issuesToastShown = true;
  toast.warning(GITHUB_ISSUES_UNAVAILABLE_MESSAGE, {
    duration: 8000,
    closeButton: true,
  });
}

/**
 * Surfaces a soft notice that the bundlephobia request failed so the user
 * knows the empty Bundle footprint card is a transient API issue rather than
 * the package genuinely having no bundle data.
 */
export function showBundleUnavailableToastOnce(): void {
  if (bundleToastShown) {
    return;
  }
  bundleToastShown = true;
  toast.warning(BUNDLE_UNAVAILABLE_MESSAGE, {
    duration: 8000,
    closeButton: true,
  });
}

/**
 * Surfaces a soft notice that advisory coverage was incomplete because a
 * source (OSV, or GitHub advisories for a known repo) couldn't be reached.
 * Security-relevant: it stops "no advisories" from being misread as a
 * confirmed clean result.
 */
export function showAdvisoryCoverageDegradedToastOnce(): void {
  if (advisoryCoverageToastShown) {
    return;
  }
  advisoryCoverageToastShown = true;
  toast.warning(ADVISORY_COVERAGE_DEGRADED_MESSAGE, {
    duration: 8000,
    closeButton: true,
  });
}

/**
 * Single entry point the side panel calls whenever fresh stats resolve. It
 * inspects every API-issue flag on the result and raises the matching deduped
 * notification, so an upstream limit or failure always tells the user what
 * happened instead of only showing an inline widget hint.
 */
export function notifyApiIssues(stats: PackageStats | null): void {
  if (!stats) {
    return;
  }
  if (stats.githubRateLimited) {
    showGithubRateLimitToastOnce();
  }
  if (stats.githubIssuesUnavailable) {
    showGithubIssuesUnavailableToastOnce();
  }
  if (stats.bundleUnavailable) {
    showBundleUnavailableToastOnce();
  }
  // Skip when a GitHub rate limit is the cause — that already fired its own,
  // more specific toast above. This covers the remaining causes (OSV outage,
  // non-rate-limit GitHub advisory failures) that would otherwise be silent.
  if (stats.advisoryCoverageDegraded && !stats.githubRateLimited) {
    showAdvisoryCoverageDegradedToastOnce();
  }
}

/**
 * Test-only escape hatch. Resets the once-per-session guards so unit tests
 * can re-exercise the gating without re-importing the module each time.
 */
export function __resetApiIssueToastsForTests(): void {
  issuesToastShown = false;
  bundleToastShown = false;
  advisoryCoverageToastShown = false;
}
