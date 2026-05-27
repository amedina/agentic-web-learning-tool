/**
 * Return the precomputed fitness score for a package, or `null` when no
 * score has been computed yet.
 *
 * This used to fall back to an alternative inline scoring formula
 * whenever `pkg.score` was missing. That fallback diverged from the
 * canonical score `getPackageStats` produces (different bundle-size
 * thresholds, different weights, the inclusion of replacement
 * availability as a positive signal), so two views rendering the same
 * package could disagree on the number. The function is now a thin
 * accessor — callers decide how to render a missing score (typically
 * `—` or omit the column).
 *
 * @param pkg - Anything that may carry a `score` field. In practice
 *   either a fully-fetched {@link PackageStats} or a partially-hydrated
 *   entry from the comparison bucket / search results.
 * @returns The numeric score when present; otherwise `null`.
 */
export function calculateScore(
  pkg: { score?: number | null } | null | undefined,
): number | null {
  return typeof pkg?.score === "number" ? pkg.score : null;
}
