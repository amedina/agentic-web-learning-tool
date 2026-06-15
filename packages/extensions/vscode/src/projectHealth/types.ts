/**
 * Wire + domain model for the Project Health feature: a workspace-wide
 * roll-up of every package.json's dependency vulnerabilities, license
 * issues, and project-level analysis (publint + circular dependencies).
 *
 * This module is intentionally free of any `vscode` import so it can be
 * bundled into BOTH the extension host and the React webview. Only plain
 * JSON-cloneable data crosses the postMessage boundary, so every type
 * here is plain data.
 */

/** Severity vocabulary shared by every vulnerability source (OSV + GitHub). */
export type VulnerabilitySeverity =
  | "critical"
  | "high"
  | "moderate"
  | "low"
  | "unknown";

/**
 * The configurable advisory severity floor, mirroring the value space of
 * the `npmAdvisor.advisorySeverityFloor` setting. "unknown" is never a
 * valid floor, so it is excluded here.
 */
export type AdvisorySeverityFloor = "critical" | "high" | "moderate" | "low";

/** Numeric rank for each severity tier; a higher rank is more urgent. */
const SEVERITY_RANK: Record<VulnerabilitySeverity, number> = {
  critical: 4,
  high: 3,
  moderate: 2,
  low: 1,
  unknown: 0,
};

/**
 * True when a vulnerability of `severity` should remain visible under the
 * given severity `floor`. Findings of "unknown" severity are always kept,
 * since a missing severity must never be silently hidden behind a floor;
 * every ranked tier must meet or exceed the floor to remain.
 */
export function isSeverityVisibleAtFloor(
  severity: VulnerabilitySeverity,
  floor: AdvisorySeverityFloor,
): boolean {
  if (severity === "unknown") {
    return true;
  }
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[floor];
}

/**
 * Which analyses a run performs. `dependencies` is the fast pass (OSV
 * vulnerabilities + licenses); `project` is the slower publint + circular
 * + replacement pass; `all` runs both.
 */
export type ProjectHealthScope = "dependencies" | "project" | "all";

/** The phases a Project Health run moves through, in order. */
export type HealthRunPhase =
  | "idle"
  | "scanning"
  | "fast-pass"
  | "backfill"
  | "complete"
  | "error"
  | "cancelled";

/** Schema version stamped onto every persisted report. Bump to invalidate. */
export const PROJECT_HEALTH_SCHEMA_VERSION = 1;

/**
 * A single vulnerability affecting one (package, version). `id` is the
 * stable advisory identifier (GHSA, falling back to a CVE or OSV id),
 * used to dedupe the same advisory across manifests in the totals.
 */
export interface VulnerabilityFinding {
  packageName: string;
  /** The version key the finding was computed against (resolved or range). */
  version: string;
  severity: VulnerabilitySeverity;
  summary: string;
  url: string;
  /** Stable advisory id (GHSA / CVE / OSV id). Empty string when unknown. */
  id: string;
}

/**
 * A dependency whose license is incompatible with the project's target
 * license (or whose license could not be resolved). Compatible licenses
 * are never recorded here.
 */
export interface LicenseFinding {
  packageName: string;
  version: string;
  license: string | null;
  /** Human-readable reason the license was flagged, when available. */
  explanation: string | null;
}

/**
 * Compact summary of a single package.json's project-level analysis
 * (publint publishing hygiene + circular dependencies). Derived from the
 * full `ProjectAnalysis` so the roll-up does not have to ship every
 * finding across the postMessage boundary for the list view.
 */
export interface PackageProjectAnalysisSummary {
  total: number;
  errorCount: number;
  warningCount: number;
  publintCount: number;
  circularCount: number;
  /** e18e replacement opportunities (lighter alternatives). Informational. */
  replaceableCount: number;
}

/** Per-package enrichment state, so the UI can show what the backfill has reached. */
export type PackageEnrichmentStatus = "pending" | "fast" | "enriched" | "error";

/**
 * One e18e replacement opportunity: a dependency that has lighter
 * alternatives. Carries the suggested replacements so the UI can show
 * what to use instead, not just a count.
 */
export interface ReplaceableSuggestion {
  /** The dependency that has lighter alternatives. */
  packageName: string;
  /** Suggested lighter replacements (package or approach names). */
  replacements: string[];
  /**
   * Documentation link (e.g. an e18e.dev guide) for the replacement, used
   * when a suggestion is an approach rather than an installable package.
   * Null when the manifest provides no link.
   */
  documentationUrl: string | null;
  /** Full human-readable message from the analyzer. */
  message: string;
}

/**
 * Everything Project Health knows about one package.json: its identity,
 * its dependency count, the vulnerability + license findings across its
 * dependency closure, and its project-level analysis summary.
 */
export interface PackageHealthEntry {
  /** `vscode.Uri.toString()` of the package.json. Routes drill-in + reveal. */
  uri: string;
  /** Workspace-relative display path, e.g. "packages/foo/package.json". */
  relativePath: string;
  /** Parsed `name` field, null when missing or invalid. */
  name: string | null;
  /** Count of declared deps + devDeps + peerDeps in this manifest. */
  dependencyCount: number;
  vulnerabilities: VulnerabilityFinding[];
  licenseIssues: LicenseFinding[];
  /** Null until the project-level analysis (publint + circular) has run. */
  projectAnalysis: PackageProjectAnalysisSummary | null;
  /** Replacement suggestions surfaced by project analysis (informational). */
  replaceable: ReplaceableSuggestion[];
  /** How far analysis has progressed for this package. */
  status: PackageEnrichmentStatus;
  /** Non-fatal messages collected while analyzing this package. */
  warnings: string[];
}

/** Per-severity vulnerability tallies plus a grand total. */
export interface VulnerabilityTotals {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  unknown: number;
  total: number;
}

/** Workspace-wide tallies shown in the Project Health header. */
export interface ProjectHealthTotals {
  packageCount: number;
  /** Distinct (name, version) pairs across every manifest. */
  uniqueDependencyCount: number;
  vulnerabilities: VulnerabilityTotals;
  licenseIssueCount: number;
  /** Total e18e replacement opportunities across every manifest. Informational. */
  replaceableCount: number;
}

/** Progress for the active run, surfaced as a determinate bar in the UI. */
export interface ProjectHealthProgress {
  phase: HealthRunPhase;
  completed: number;
  total: number;
  /** Short human label, e.g. "Analyzing lodash (42/380)". */
  label: string;
}

/**
 * The complete Project Health report for one workspace. Persisted to
 * globalState (for daily-freshness + diff-on-notify) and posted to the
 * webview as it is built up across the fast and backfill passes.
 */
export interface ProjectHealthReport {
  schemaVersion: number;
  /** Stable key identifying the workspace this report belongs to. */
  workspaceKey: string;
  workspaceName: string | null;
  /** `Date.now()` when this snapshot was produced. */
  generatedAt: number;
  /** `Date.now()` when the current run started. */
  startedAt: number;
  phase: HealthRunPhase;
  packages: PackageHealthEntry[];
  totals: ProjectHealthTotals;
  progress: ProjectHealthProgress;
  warnings: string[];
  /** `Date.now()` the fast pass (vuln + license) finished, null until then. */
  fastPassCompletedAt: number | null;
  /** `Date.now()` the backfill (full per-dep stats) finished, null until then. */
  backfillCompletedAt: number | null;
}

/** True when the phase represents a finished run (no further updates expected). */
export function isTerminalPhase(phase: HealthRunPhase): boolean {
  return phase === "complete" || phase === "error" || phase === "cancelled";
}
