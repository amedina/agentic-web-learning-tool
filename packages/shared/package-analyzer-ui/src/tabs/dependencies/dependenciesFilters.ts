/**
 * Internal dependencies.
 */
import { type PackageStats } from "@agentic-web-labs/package-analyzer-core";
import {
  type DependencyStatsByName,
  type DependencyStatsState,
} from "../../hooks/useDependencyStats";

export type DependenciesFilterKey =
  | "withIssues"
  | "vulnerable"
  | "licenseIssue"
  | "replaceable";

export type DependenciesFilterSet = ReadonlySet<DependenciesFilterKey>;

const hasVulnerabilities = (stats: PackageStats): boolean =>
  (stats.securityAdvisories?.issues?.length ?? 0) > 0;

const hasLicenseIssue = (stats: PackageStats): boolean =>
  stats.licenseCompatibility?.isCompatible === false;

const hasReplaceable = (stats: PackageStats): boolean => {
  const recommendations = stats.recommendations;
  if (!recommendations) {
    return false;
  }
  return (
    (recommendations.nativeReplacements?.length ?? 0) > 0 ||
    (recommendations.preferredReplacements?.length ?? 0) > 0 ||
    (recommendations.microUtilityReplacements?.length ?? 0) > 0
  );
};

// "Replaceable" is intentionally excluded from "With Issues": an available
// e18e replacement is informational, not a problem with the package, so it is
// not an issue or a warning. It remains its own standalone filter.
const PREDICATES: Record<
  DependenciesFilterKey,
  (stats: PackageStats) => boolean
> = {
  vulnerable: hasVulnerabilities,
  licenseIssue: hasLicenseIssue,
  replaceable: hasReplaceable,
  withIssues: (stats) => hasVulnerabilities(stats) || hasLicenseIssue(stats),
};

/**
 * Returns true when the row should be visible given the active filters.
 * AND semantics: when multiple filters are active a package must satisfy
 * every one. Pending / errored / not-found rows are hidden as soon as any
 * filter is active because we can't classify them.
 */
export function matchesFilters(
  state: DependencyStatsState | undefined,
  filters: DependenciesFilterSet,
): boolean {
  if (filters.size === 0) {
    return true;
  }
  if (state?.status !== "loaded") {
    return false;
  }
  for (const key of filters) {
    if (!PREDICATES[key](state.stats)) {
      return false;
    }
  }
  return true;
}

/**
 * Standalone counts (how many packages match each predicate on its own).
 * Shown on the pill so the user can see the universe size per filter
 * regardless of which other filters are currently active.
 */
export interface DependenciesFilterCounts {
  total: number;
  withIssues: number;
  vulnerable: number;
  licenseIssue: number;
  replaceable: number;
}

export function computeFilterCounts(
  allPackageNames: string[],
  statsByName: DependencyStatsByName,
): DependenciesFilterCounts {
  let withIssues = 0;
  let vulnerable = 0;
  let licenseIssue = 0;
  let replaceable = 0;

  for (const name of allPackageNames) {
    const entry = statsByName[name];
    if (entry?.status !== "loaded") {
      continue;
    }
    const stats = entry.stats;
    const v = hasVulnerabilities(stats);
    const l = hasLicenseIssue(stats);
    const r = hasReplaceable(stats);
    if (v) {
      vulnerable += 1;
    }
    if (l) {
      licenseIssue += 1;
    }
    if (r) {
      replaceable += 1;
    }
    if (v || l) {
      withIssues += 1;
    }
  }

  return {
    total: allPackageNames.length,
    withIssues,
    vulnerable,
    licenseIssue,
    replaceable,
  };
}
