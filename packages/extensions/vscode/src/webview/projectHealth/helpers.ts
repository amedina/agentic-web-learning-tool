/**
 * External dependencies.
 */
import type {
  PackageHealthEntry,
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
  | "replaceable"
  | "suppressed";

/** Returns `filter` unless it is already active, in which case `all` (a toggle). */
export function toggleFilter(
  current: ListFilter,
  filter: ListFilter,
): ListFilter {
  return current === filter ? "all" : filter;
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

/**
 * Counts only the actionable problems for a package: vulnerabilities,
 * license issues, publint findings, and circular dependencies.
 * Replacement suggestions are excluded because they are informational
 * optimizations, not problems, so they never remove a row's clean check.
 */
export function packageProblemCount(entry: PackageHealthEntry): number {
  const publint = entry.projectAnalysis?.publintCount ?? 0;
  const circular = entry.projectAnalysis?.circularCount ?? 0;
  return (
    entry.vulnerabilities.length +
    entry.licenseIssues.length +
    publint +
    circular
  );
}

/**
 * True when a package is genuinely clean: its project analysis actually
 * ran (so publint / circular are known, not merely absent) and there are
 * no problems. Replacement suggestions do not affect cleanliness. When
 * project analysis did not run for a package, it is not reported clean.
 */
export function isPackageClean(entry: PackageHealthEntry): boolean {
  return entry.projectAnalysis !== null && packageProblemCount(entry) === 0;
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
