/**
 * Internal dependencies.
 */
import {
  isLicenseSuppressed,
  isVulnerabilitySuppressed,
} from "../../projectHealth/suppressionMatching";
import type {
  PackageHealthEntry,
  ProjectHealthReport,
  ProjectHealthScope,
  SuppressionEntry,
  VulnerabilitySeverity,
} from "../../projectHealth/types";

/**
 * Tailwind class fragments describing the visual tone for one
 * vulnerability severity. `pill` is the full chip styling; `text` and
 * `dot` are the standalone color tokens for compact contexts.
 */
export interface SeverityTone {
  pill: string;
  text: string;
  dot: string;
}

/**
 * Maps each vulnerability severity to its color tone. Critical is red,
 * high is orange, moderate is amber, low and unknown fall back to slate
 * so they read as the least urgent tier.
 */
const SEVERITY_TONES: Record<VulnerabilitySeverity, SeverityTone> = {
  critical: {
    pill: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
  high: {
    pill: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  moderate: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  low: {
    pill: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-400",
  },
  unknown: {
    pill: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-400",
  },
};

/**
 * Returns the color tone for a vulnerability severity, defaulting to the
 * slate "unknown" tone for any value outside the known vocabulary.
 */
export function severityTone(severity: VulnerabilitySeverity): SeverityTone {
  return SEVERITY_TONES[severity] ?? SEVERITY_TONES.unknown;
}

/** Severities ordered most to least urgent, for stable badge rendering. */
export const SEVERITY_ORDER: VulnerabilitySeverity[] = [
  "critical",
  "high",
  "moderate",
  "low",
  "unknown",
];

/**
 * The active roll-up filter. `all` shows every package; the others
 * narrow the list to packages that carry that kind of finding.
 */
export type ListFilter =
  | "all"
  | "vuln"
  | "license"
  | "publint"
  | "circular"
  | "replaceable"
  | "suppressed";

/** Returns `filter` unless it is already active, in which case `all` (a toggle). */
export function toggleFilter(
  current: ListFilter,
  filter: ListFilter,
): ListFilter {
  return current === filter ? "all" : filter;
}

/** Matches a plausible npm package name (optionally scoped). */
const PACKAGE_NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

/**
 * True when a string looks like an npm package name (so a replacement
 * suggestion can be linked to npmjs.com). Free-text approaches like
 * "use optional chaining" are excluded.
 */
export function isLikelyPackageName(value: string): boolean {
  return PACKAGE_NAME.test(value.trim());
}

/** Builds the npmjs.com page URL for a package. */
export function npmPackageUrl(name: string): string {
  return `https://www.npmjs.com/package/${name.trim()}`;
}

/**
 * Formats a millisecond epoch as a coarse relative time such as
 * "just now", "2 minutes ago", or "3 hours ago". Good enough for the
 * "Last run" hint in the header; falls back to days for older snapshots.
 */
export function formatRelativeTime(epoch: number): string {
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - epoch) / 1000));
  if (elapsedSeconds < 45) {
    return "just now";
  }
  const minutes = Math.round(elapsedSeconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

/**
 * Totals every surfaced finding for one package (vulnerabilities,
 * license issues, and all project-analysis findings including
 * replacements). Used to sort the roll-up so the noisiest manifests
 * float to the top.
 */
export function packageIssueCount(entry: PackageHealthEntry): number {
  const projectAnalysisTotal = entry.projectAnalysis?.total ?? 0;
  return (
    entry.vulnerabilities.length +
    entry.licenseIssues.length +
    projectAnalysisTotal
  );
}

/** True when a package has at least one non-suppressed vulnerability. */
export function entryHasActiveVulnerability(
  entry: PackageHealthEntry,
  suppressions: SuppressionEntry[],
): boolean {
  return entry.vulnerabilities.some(
    (finding) => !isVulnerabilitySuppressed(suppressions, finding),
  );
}

/** True when a package has at least one non-suppressed license issue. */
export function entryHasActiveLicenseIssue(
  entry: PackageHealthEntry,
  suppressions: SuppressionEntry[],
): boolean {
  return entry.licenseIssues.some(
    (finding) => !isLicenseSuppressed(suppressions, finding),
  );
}

/** True when a package has at least one replacement suggestion. */
export function entryHasReplaceable(entry: PackageHealthEntry): boolean {
  return entry.replaceable.length > 0;
}

/** True when a package has at least one publint (publishing) finding. */
export function entryHasPublint(entry: PackageHealthEntry): boolean {
  return (entry.projectAnalysis?.publintCount ?? 0) > 0;
}

/** True when a package has at least one circular dependency. */
export function entryHasCircular(entry: PackageHealthEntry): boolean {
  return (entry.projectAnalysis?.circularCount ?? 0) > 0;
}

/** True when a package carries at least one currently-suppressed finding. */
export function entryHasSuppressed(
  entry: PackageHealthEntry,
  suppressions: SuppressionEntry[],
): boolean {
  return (
    entry.vulnerabilities.some((finding) =>
      isVulnerabilitySuppressed(suppressions, finding),
    ) ||
    entry.licenseIssues.some((finding) =>
      isLicenseSuppressed(suppressions, finding),
    )
  );
}

/**
 * The single source of truth for "does this package match the active
 * filter?", used by both the header chip counts and the list filtering
 * so the chip number always equals the number of rows shown.
 */
export function entryMatchesFilter(
  entry: PackageHealthEntry,
  filter: ListFilter,
  suppressions: SuppressionEntry[],
): boolean {
  switch (filter) {
    case "vuln":
      return entryHasActiveVulnerability(entry, suppressions);
    case "license":
      return entryHasActiveLicenseIssue(entry, suppressions);
    case "publint":
      return entryHasPublint(entry);
    case "circular":
      return entryHasCircular(entry);
    case "replaceable":
      return entryHasReplaceable(entry);
    case "suppressed":
      return entryHasSuppressed(entry, suppressions);
    case "all":
    default:
      return true;
  }
}

/**
 * True when the report has at least one actionable, non-suppressed
 * finding within the given scope worth assembling into a fix prompt.
 * "dependencies" covers vulnerabilities + license issues; "project"
 * covers publint + circular findings; "all" covers both. Replaceable
 * suggestions are informational, not issues, so they never count here.
 */
export function reportHasActionableFindings(
  report: ProjectHealthReport,
  suppressions: SuppressionEntry[],
  scope: ProjectHealthScope = "all",
): boolean {
  const includeDependencies = scope !== "project";
  const includeProject = scope !== "dependencies";
  return report.packages.some((entry) => {
    if (
      includeDependencies &&
      (entryHasActiveVulnerability(entry, suppressions) ||
        entryHasActiveLicenseIssue(entry, suppressions))
    ) {
      return true;
    }
    if (includeProject) {
      return entryHasPublint(entry) || entryHasCircular(entry);
    }
    return false;
  });
}

/**
 * Assembles a ready-to-paste prompt covering the actionable findings in
 * the given scope, grouped by package. Suppressed vulnerabilities and
 * license issues are excluded. The assistant is pointed at the
 * npm-advisor MCP tools for deeper detail.
 */
export function buildAggregateFixPrompt(
  report: ProjectHealthReport,
  suppressions: SuppressionEntry[],
  scope: ProjectHealthScope = "all",
): string {
  const includeDependencies = scope !== "project";
  const includeProject = scope !== "dependencies";
  const subject =
    scope === "dependencies"
      ? "dependency vulnerabilities and license issues"
      : scope === "project"
        ? "publishing and circular-dependency issues"
        : "issues";

  const lines: string[] = [];
  lines.push(
    `I ran NPM Advisor Project Health across my workspace. Help me fix the ${subject} below, grouped by package, preferring root-cause fixes over file-by-file edits. Use the npm-advisor MCP tools (analyze_project, analyze_package_json) for full detail where needed.`,
  );
  lines.push("");

  for (const entry of report.packages) {
    const vulnerabilities = includeDependencies
      ? entry.vulnerabilities.filter(
          (finding) => !isVulnerabilitySuppressed(suppressions, finding),
        )
      : [];
    const licenseIssues = includeDependencies
      ? entry.licenseIssues.filter(
          (finding) => !isLicenseSuppressed(suppressions, finding),
        )
      : [];
    const analysis = includeProject ? entry.projectAnalysis : null;
    const hasProjectFindings =
      analysis !== null && analysis.publintCount + analysis.circularCount > 0;
    if (
      vulnerabilities.length === 0 &&
      licenseIssues.length === 0 &&
      !hasProjectFindings
    ) {
      continue;
    }

    lines.push(
      `## ${entry.relativePath}${entry.name ? ` (${entry.name})` : ""}`,
    );
    if (vulnerabilities.length > 0) {
      lines.push(`- Vulnerabilities (${vulnerabilities.length}):`);
      for (const finding of vulnerabilities.slice(0, 10)) {
        lines.push(
          `  - [${finding.severity}] ${finding.packageName}@${finding.version}: ${finding.summary} (${finding.id})`,
        );
      }
    }
    if (licenseIssues.length > 0) {
      lines.push(`- License issues (${licenseIssues.length}):`);
      for (const finding of licenseIssues.slice(0, 10)) {
        const reason = finding.explanation ? ` (${finding.explanation})` : "";
        lines.push(
          `  - ${finding.packageName}@${finding.version}: ${finding.license ?? "unknown"}${reason}`,
        );
      }
    }
    if (analysis) {
      if (analysis.publintCount > 0) {
        lines.push(`- Publishing (publint) issues: ${analysis.publintCount}`);
      }
      if (analysis.circularCount > 0) {
        lines.push(`- Circular dependencies: ${analysis.circularCount}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/**
 * Tallies a package's vulnerabilities by severity so a row can render
 * one badge per non-empty tier without re-scanning the list per badge.
 */
export function tallyVulnerabilities(
  vulnerabilities: PackageHealthEntry["vulnerabilities"],
): Record<VulnerabilitySeverity, number> {
  const counts: Record<VulnerabilitySeverity, number> = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    unknown: 0,
  };
  for (const finding of vulnerabilities) {
    counts[finding.severity] += 1;
  }
  return counts;
}
