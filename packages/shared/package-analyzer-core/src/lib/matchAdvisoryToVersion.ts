/**
 * External dependencies.
 */
import {
  satisfies as semverSatisfies,
  coerce as semverCoerce,
  validRange as semverValidRange,
} from "semver";

/**
 * One entry under a GitHub Security Advisory's `vulnerabilities[]` array.
 * Only the fields used for version matching are typed here; the upstream
 * payload carries more, but this module deliberately ignores anything
 * else so callers can pass raw API objects without re-shaping them.
 */
export interface AdvisoryVulnerability {
  package?: {
    ecosystem?: string;
    name?: string;
  };
  vulnerable_version_range?: string;
}

/**
 * Subset of the GitHub Security Advisory payload this module reads.
 * Accepts the full upstream object — extra fields are ignored.
 */
export interface AdvisoryForMatching {
  vulnerabilities?: AdvisoryVulnerability[];
}

/**
 * Decide whether a security advisory is relevant to the version of a
 * package the user has installed. Used by `getPackageStats` to filter the
 * advisories returned by GitHub's `/security-advisories` endpoint so the
 * UI only counts advisories that actually affect the user's install.
 *
 * Matching rules:
 * - When `consideredVersion` is `null` (no version data — typically
 *   because the caller couldn't resolve from a lockfile and couldn't get
 *   a latest version either), all advisories are kept. This preserves
 *   the pre-1b behaviour for the no-data case.
 * - When the advisory has no `vulnerabilities[]` entries (older or
 *   malformed advisories), it is kept. Excluding would silently drop
 *   real findings; matching falls back to "include" rather than "skip".
 * - When at least one vulnerability targets this package (by ecosystem +
 *   name, case-insensitive) and the `consideredVersion` falls inside its
 *   `vulnerable_version_range`, the advisory is kept.
 * - Vulnerabilities flagged for a different ecosystem (e.g. composer) or
 *   a different package name are skipped without contributing to the
 *   decision. This matters for monorepo repos like `lodash/lodash` whose
 *   advisory feed mentions multiple package names.
 * - Malformed version ranges are logged via `console.warn` and skipped;
 *   they don't crash the whole stats fetch.
 *
 * @param advisory - Raw advisory object from GitHub's API.
 * @param packageName - The npm package whose stats are being computed.
 * @param consideredVersion - The version against which to match (the
 *   `resolvedVersion` from a lockfile when known, otherwise the latest
 *   published version, or `null` if neither is known).
 * @returns `true` when the advisory should count toward this package's
 *   security findings.
 */
export function matchesAdvisoryVersion(
  advisory: AdvisoryForMatching,
  packageName: string,
  consideredVersion: string | null,
): boolean {
  if (!consideredVersion) {
    return true;
  }
  const vulns = Array.isArray(advisory?.vulnerabilities)
    ? advisory.vulnerabilities
    : [];
  if (vulns.length === 0) {
    return true;
  }

  const normalizedPackageName = packageName.toLowerCase();
  const normalizedConsidered = normalizeForSemver(consideredVersion);
  if (!normalizedConsidered) {
    return true;
  }

  for (const vuln of vulns) {
    const ecosystem = vuln?.package?.ecosystem;
    if (typeof ecosystem === "string" && ecosystem.toLowerCase() !== "npm") {
      continue;
    }
    const vulnPackageName = vuln?.package?.name;
    if (
      typeof vulnPackageName === "string" &&
      vulnPackageName.toLowerCase() !== normalizedPackageName
    ) {
      continue;
    }

    const rawRange = vuln?.vulnerable_version_range;
    if (typeof rawRange !== "string" || rawRange.trim().length === 0) {
      continue;
    }
    const range = normalizeGhsaRange(rawRange);
    if (semverValidRange(range, { loose: true }) === null) {
      console.warn(
        `[NPM Advisor] Skipping advisory range "${rawRange}" — could not be parsed as a semver range.`,
      );
      continue;
    }
    if (
      semverSatisfies(normalizedConsidered, range, {
        includePrerelease: true,
        loose: true,
      })
    ) {
      return true;
    }
  }

  return false;
}

/**
 * GitHub publishes vulnerable ranges as comma-separated semver
 * comparators (e.g. `">= 4.0.0, < 4.17.21"`). node-semver expects the
 * same comparators space-separated. Normalise by splitting on commas and
 * joining with spaces.
 */
function normalizeGhsaRange(range: string): string {
  return range
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");
}

/**
 * Coerce a possibly-loose version string into a valid semver. Returns
 * `null` when the string carries no recognisable version (e.g. the
 * upstream payload is broken). Loose tolerance here matters because
 * `dist-tags.latest` is occasionally written as `"1.2.3-rc"` or
 * `"v1.2.3"` in older registries.
 */
function normalizeForSemver(version: string): string | null {
  const coerced = semverCoerce(version, { includePrerelease: true });
  return coerced ? coerced.version : null;
}
