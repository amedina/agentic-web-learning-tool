/**
 * External dependencies.
 */
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";
import type {
  ProjectAnalysis,
  ProjectFinding,
} from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import {
  PROJECT_HEALTH_SCHEMA_VERSION,
  type LicenseFinding,
  type PackageHealthEntry,
  type PackageProjectAnalysisSummary,
  type ProjectHealthReport,
  type ProjectHealthTotals,
  type ReplaceableSuggestion,
  type VulnerabilityFinding,
  type VulnerabilitySeverity,
  type VulnerabilityTotals,
} from "./types";

/**
 * Predicates the totals calculation uses to decide whether a finding is
 * suppressed (muted by the user). Suppressed findings stay in the report
 * for the "muted" view but are excluded from active totals and counted
 * under `suppressedCount`. Phase 1 passes none, so nothing is suppressed.
 */
export interface SuppressionPredicates {
  isVulnerabilitySuppressed?: (finding: VulnerabilityFinding) => boolean;
  isLicenseSuppressed?: (finding: LicenseFinding) => boolean;
}

/** Returns a zeroed vulnerability tally. */
export function emptyVulnerabilityTotals(): VulnerabilityTotals {
  return { critical: 0, high: 0, moderate: 0, low: 0, unknown: 0, total: 0 };
}

/**
 * Normalizes any source's free-form severity string into the shared
 * vocabulary. Unrecognized values (including "medium", which some feeds
 * use for "moderate") are mapped conservatively; anything unknown falls
 * through to "unknown".
 */
export function normalizeSeverity(value: string | null): VulnerabilitySeverity {
  switch ((value ?? "").trim().toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "moderate":
    case "medium":
      return "moderate";
    case "low":
      return "low";
    default:
      return "unknown";
  }
}

/**
 * Derives a stable advisory id from an advisory URL (preferred) or its
 * summary (fallback). GitHub advisory URLs embed the GHSA id and OSV
 * links embed GHSA/CVE ids, so extracting it yields the same id the
 * OSV fast pass reports, keeping suppression keys consistent across the
 * fast and backfill passes. Falls back to the trimmed summary when no
 * recognizable id is present.
 */
export function deriveAdvisoryId(url: string, summary: string): string {
  const match = url.match(/GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/i);
  if (match) {
    return match[0].toUpperCase();
  }
  const cve = url.match(/CVE-\d{4}-\d{4,}/i);
  if (cve) {
    return cve[0].toUpperCase();
  }
  return summary.trim();
}

/**
 * Extracts vulnerability findings for one (package, version) from its
 * PackageStats. Reads `securityAdvisories.issues`, mapping each to a
 * VulnerabilityFinding with a stable suppression id. Returns an empty
 * array when stats are missing or carry no advisories.
 */
export function vulnerabilitiesFromStats(
  packageName: string,
  version: string,
  stats: PackageStats | null,
): VulnerabilityFinding[] {
  const issues = stats?.securityAdvisories?.issues ?? [];
  return issues.map((issue) => ({
    packageName,
    version,
    severity: normalizeSeverity(issue.severity),
    summary: issue.summary,
    url: issue.url,
    id: deriveAdvisoryId(issue.url, issue.summary),
  }));
}

/**
 * Returns a license finding for one (package, version) when its license
 * is incompatible with the project's target license, or null otherwise.
 * Compatible (or unknown-but-not-flagged) licenses produce no finding.
 */
export function licenseFindingFromStats(
  packageName: string,
  version: string,
  stats: PackageStats | null,
): LicenseFinding | null {
  const compatibility = stats?.licenseCompatibility;
  if (!compatibility || compatibility.isCompatible) {
    return null;
  }
  return {
    packageName,
    version,
    license: stats?.license ?? null,
    explanation: compatibility.explanation ?? null,
  };
}

/**
 * Condenses a full ProjectAnalysis into the compact summary the roll-up
 * list shows per package: total findings, error/warning counts, and the
 * publint vs circular-dependency split.
 */
export function summarizeProjectAnalysis(
  analysis: ProjectAnalysis,
): PackageProjectAnalysisSummary {
  const bySeverity = analysis.summary.bySeverity;
  const bySource = analysis.summary.bySource;
  return {
    total: analysis.summary.total,
    errorCount: bySeverity.error ?? 0,
    warningCount: bySeverity.warning ?? 0,
    publintCount: bySource.publint ?? 0,
    circularCount: bySource["circular-deps"] ?? 0,
    replaceableCount: bySource.replacements ?? 0,
  };
}

/**
 * Extracts the replacement suggestions from a ProjectAnalysis: every
 * `replacements` finding, mapped to the dependency and its lighter
 * alternatives so the UI can show what to use instead of a bare count.
 */
export function replacementsFromAnalysis(
  analysis: ProjectAnalysis,
): ReplaceableSuggestion[] {
  return replacementsFromFindings(analysis.findings);
}

/**
 * Maps the `replacements` project findings into ReplaceableSuggestions.
 * Shared by the full-analysis path and the standalone replacement scan
 * used by the fast dependency pass.
 */
export function replacementsFromFindings(
  findings: ProjectFinding[],
): ReplaceableSuggestion[] {
  return findings
    .filter((finding) => finding.source === "replacements")
    .map((finding) => {
      const data = (finding.data ?? {}) as {
        packageName?: unknown;
        replacements?: unknown;
        documentationUrl?: unknown;
      };
      const replacements = Array.isArray(data.replacements)
        ? data.replacements.filter(
            (value): value is string => typeof value === "string",
          )
        : [];
      return {
        packageName:
          typeof data.packageName === "string" ? data.packageName : "",
        replacements,
        documentationUrl:
          typeof data.documentationUrl === "string"
            ? data.documentationUrl
            : null,
        message: finding.message,
      };
    });
}

/**
 * Computes workspace-wide totals from the per-package entries. Findings
 * are deduped across packages by a stable key (package + version +
 * advisory id for vulnerabilities; package + version for licenses) so a
 * single vulnerable dependency shared by many manifests counts once in
 * the header. Suppressed findings are excluded from the active tallies
 * and counted under `suppressedCount`.
 */
export function computeTotals(
  packages: PackageHealthEntry[],
  uniqueDependencyCount: number,
  predicates: SuppressionPredicates = {},
): ProjectHealthTotals {
  const vulnerabilities = emptyVulnerabilityTotals();
  const seenVulns = new Set<string>();
  const seenLicenses = new Set<string>();
  let licenseIssueCount = 0;
  let replaceableCount = 0;
  let suppressedCount = 0;

  for (const entry of packages) {
    replaceableCount += entry.replaceable.length;
    for (const vulnerability of entry.vulnerabilities) {
      const key = `${vulnerability.packageName}@${vulnerability.version}::${vulnerability.id}`;
      if (seenVulns.has(key)) {
        continue;
      }
      seenVulns.add(key);
      if (predicates.isVulnerabilitySuppressed?.(vulnerability)) {
        suppressedCount += 1;
        continue;
      }
      vulnerabilities[vulnerability.severity] += 1;
      vulnerabilities.total += 1;
    }

    for (const license of entry.licenseIssues) {
      const key = `${license.packageName}@${license.version}`;
      if (seenLicenses.has(key)) {
        continue;
      }
      seenLicenses.add(key);
      if (predicates.isLicenseSuppressed?.(license)) {
        suppressedCount += 1;
        continue;
      }
      licenseIssueCount += 1;
    }
  }

  return {
    packageCount: packages.length,
    uniqueDependencyCount,
    vulnerabilities,
    licenseIssueCount,
    replaceableCount,
    suppressedCount,
  };
}

/**
 * Builds the initial "scanning" report shell for a workspace before any
 * dependency has been analyzed. The aggregator mutates/replaces fields
 * as the fast and backfill passes progress.
 */
export function createInitialReport(
  workspaceKey: string,
  workspaceName: string | null,
  now: number,
): ProjectHealthReport {
  return {
    schemaVersion: PROJECT_HEALTH_SCHEMA_VERSION,
    workspaceKey,
    workspaceName,
    generatedAt: now,
    startedAt: now,
    phase: "scanning",
    packages: [],
    totals: {
      packageCount: 0,
      uniqueDependencyCount: 0,
      vulnerabilities: emptyVulnerabilityTotals(),
      licenseIssueCount: 0,
      replaceableCount: 0,
      suppressedCount: 0,
    },
    progress: {
      phase: "scanning",
      completed: 0,
      total: 0,
      label: "Scanning workspace…",
    },
    warnings: [],
    fastPassCompletedAt: null,
    backfillCompletedAt: null,
  };
}
