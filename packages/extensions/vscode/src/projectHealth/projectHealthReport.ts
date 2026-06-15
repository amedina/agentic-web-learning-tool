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
  isSeverityVisibleAtFloor,
  type AdvisorySeverityFloor,
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
 * OSV fast pass reports, keeping the dedup key consistent across the
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
 * VulnerabilityFinding with a stable id. Returns an empty array when
 * stats are missing or carry no advisories.
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
 * the header. `vulnerablePackageCount` and `licenseIssuePackageCount`
 * instead count the number of affected package.json files (one per
 * manifest, not deduped findings), mirroring the panel chips so the daily
 * notification and the panel agree.
 */
export function computeTotals(
  packages: PackageHealthEntry[],
  uniqueDependencyCount: number,
): ProjectHealthTotals {
  const vulnerabilities = emptyVulnerabilityTotals();
  const seenVulns = new Set<string>();
  const seenLicenses = new Set<string>();
  let licenseIssueCount = 0;
  let replaceableCount = 0;
  let vulnerablePackageCount = 0;
  let licenseIssuePackageCount = 0;

  for (const entry of packages) {
    replaceableCount += entry.replaceable.length;
    if (entry.vulnerabilities.length > 0) {
      vulnerablePackageCount += 1;
    }
    if (entry.licenseIssues.length > 0) {
      licenseIssuePackageCount += 1;
    }
    for (const vulnerability of entry.vulnerabilities) {
      const key = `${vulnerability.packageName}@${vulnerability.version}::${vulnerability.id}`;
      if (seenVulns.has(key)) {
        continue;
      }
      seenVulns.add(key);
      vulnerabilities[vulnerability.severity] += 1;
      vulnerabilities.total += 1;
    }

    for (const license of entry.licenseIssues) {
      const key = `${license.packageName}@${license.version}`;
      if (seenLicenses.has(key)) {
        continue;
      }
      seenLicenses.add(key);
      licenseIssueCount += 1;
    }
  }

  return {
    packageCount: packages.length,
    uniqueDependencyCount,
    vulnerabilities,
    vulnerablePackageCount,
    licenseIssueCount,
    licenseIssuePackageCount,
    replaceableCount,
  };
}

/**
 * Returns a copy of `report` with every package's vulnerabilities narrowed
 * to those at or above `floor` (advisories of unknown severity are always
 * kept) and the workspace totals recomputed from the narrowed set, so the
 * header chips, severity breakdown, row badges, and fix prompt all stay
 * consistent with the filtered list. The "All packages" Dependencies view
 * applies this by default so it mirrors `npmAdvisor.advisorySeverityFloor`;
 * a "Show all severity levels" toggle bypasses it. Packages with nothing
 * removed are reused by reference to avoid needless re-renders.
 */
export function filterReportBySeverityFloor(
  report: ProjectHealthReport,
  floor: AdvisorySeverityFloor,
): ProjectHealthReport {
  const packages = report.packages.map((entry) => {
    const visible = entry.vulnerabilities.filter((finding) =>
      isSeverityVisibleAtFloor(finding.severity, floor),
    );
    if (visible.length === entry.vulnerabilities.length) {
      return entry;
    }
    return { ...entry, vulnerabilities: visible };
  });
  return {
    ...report,
    packages,
    totals: computeTotals(packages, report.totals.uniqueDependencyCount),
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
      vulnerablePackageCount: 0,
      licenseIssueCount: 0,
      licenseIssuePackageCount: 0,
      replaceableCount: 0,
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
