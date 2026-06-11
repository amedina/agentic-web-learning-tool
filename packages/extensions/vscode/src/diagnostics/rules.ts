/**
 * External dependencies.
 */
import * as vscode from "vscode";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import type { PackageJsonDependency } from "../packageJson/parse";
import {
  isAtOrAboveFloor,
  type AdvisorySeverity,
  type NpmAdvisorSettings,
} from "./settings";

export interface EvaluateOptions {
  now?: () => Date;
}

const ADVISORY_SEVERITIES: AdvisorySeverity[] = [
  "critical",
  "high",
  "moderate",
  "low",
];

/**
 * Pure rules pipeline. Runs every rule against a (dependency, stats)
 * pair under the user's settings and returns zero or more
 * vscode.Diagnostic instances. Order of returned diagnostics matches
 * the rule registration order: advisory, license, unmaintained,
 * outdated.
 */
export function evaluateDiagnostics(
  dependency: PackageJsonDependency,
  stats: PackageStats,
  settings: NpmAdvisorSettings,
  options: EvaluateOptions = {},
): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const now = options.now ?? (() => new Date());

  const advisoryDiagnostic = buildAdvisoryDiagnostic(
    dependency,
    stats,
    settings.advisorySeverityFloor,
  );
  if (advisoryDiagnostic) {
    diagnostics.push(advisoryDiagnostic);
  }

  const licenseDiagnostic = buildLicenseDiagnostic(
    dependency,
    stats,
    settings.targetLicense,
  );
  if (licenseDiagnostic) {
    diagnostics.push(licenseDiagnostic);
  }

  const unmaintainedDiagnostic = buildUnmaintainedDiagnostic(
    dependency,
    stats,
    settings.unmaintainedThresholdDays,
    now(),
  );
  if (unmaintainedDiagnostic) {
    diagnostics.push(unmaintainedDiagnostic);
  }

  const outdatedDiagnostic = buildOutdatedDiagnostic(
    dependency,
    stats,
    settings.outdatedMajorThreshold,
  );
  if (outdatedDiagnostic) {
    diagnostics.push(outdatedDiagnostic);
  }

  return diagnostics;
}

/**
 * Pull a major version number out of an npm spec like "^1.2.3", "~1.0",
 * or ">=2.0.0". Returns null for ranges, tags, and non-semver protocols
 * (workspace:*, file:, github:, "*", "latest", etc.) where a stable
 * major comparison isn't meaningful.
 */
export function extractMajor(spec: string): number | null {
  if (!spec || typeof spec !== "string") {
    return null;
  }
  const trimmed = spec.trim();
  if (
    trimmed.startsWith("workspace:") ||
    trimmed.startsWith("file:") ||
    trimmed.startsWith("link:") ||
    trimmed.startsWith("git+") ||
    trimmed.startsWith("github:") ||
    trimmed.startsWith("http")
  ) {
    return null;
  }
  const match = /^[\^~>=<\s]*(\d+)/.exec(trimmed);
  return match ? Number(match[1]) : null;
}

/**
 * Information-severity diagnostic when the installed major version
 * trails the latest published release by at least the configured
 * threshold. Skipped when latest version is unknown or either side
 * lacks a parseable major.
 */
function buildOutdatedDiagnostic(
  dependency: PackageJsonDependency,
  stats: PackageStats,
  threshold: number,
): vscode.Diagnostic | null {
  if (!stats.latestVersion) {
    return null;
  }
  const installedMajor = extractMajor(dependency.version);
  const latestMajor = extractMajor(stats.latestVersion);
  if (installedMajor === null || latestMajor === null) {
    return null;
  }
  const behind = latestMajor - installedMajor;
  if (behind < threshold) {
    return null;
  }
  const diagnostic = new vscode.Diagnostic(
    dependency.nameRange,
    `${dependency.name} is ${behind} major versions behind latest (${stats.latestVersion}).`,
    vscode.DiagnosticSeverity.Information,
  );
  diagnostic.source = "npm-advisor";
  diagnostic.code = "outdated-major";
  return diagnostic;
}

/**
 * Error-severity diagnostic when any GitHub Security Advisory at or
 * above the configured floor (`critical`, `high`, etc.) applies to the
 * package. Lower-severity advisories are not surfaced.
 */
function buildAdvisoryDiagnostic(
  dependency: PackageJsonDependency,
  stats: PackageStats,
  floor: AdvisorySeverity,
): vscode.Diagnostic | null {
  if (!stats.securityAdvisories) {
    return null;
  }
  const counts: Record<AdvisorySeverity, number> = {
    critical: stats.securityAdvisories.critical,
    high: stats.securityAdvisories.high,
    moderate: stats.securityAdvisories.moderate,
    low: stats.securityAdvisories.low,
  };
  const offending = ADVISORY_SEVERITIES.filter(
    (severity) => counts[severity] > 0 && isAtOrAboveFloor(severity, floor),
  );
  if (offending.length === 0) {
    return null;
  }
  const summary = offending
    .map((severity) => `${counts[severity]} ${severity}`)
    .join(", ");
  const diagnostic = new vscode.Diagnostic(
    dependency.nameRange,
    `${dependency.name} has security advisories: ${summary}. ${formatResolutionContext(stats)}`,
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "npm-advisor";
  diagnostic.code = "security-advisory";
  return diagnostic;
}

/**
 * Render a short suffix that tells the user which version the advisories
 * apply to and how that version was determined. Surfaced in the
 * diagnostic message so anyone reading the Problems panel can tell
 * whether the verdict reflects their lockfile or the latest release.
 */
function formatResolutionContext(stats: PackageStats): string {
  if (stats.versionResolution === "lockfile" && stats.consideredVersion) {
    return `(installed ${stats.consideredVersion}).`;
  }
  if (stats.consideredVersion) {
    return `(no lockfile, showing latest ${stats.consideredVersion}).`;
  }
  return "(no lockfile, showing latest).";
}

/**
 * Warning-severity diagnostic when the dependency's license is not
 * compatible with the project's target license per the cached OSADL
 * compatibility check. Includes the analyzer's explanation when one
 * is available.
 */
function buildLicenseDiagnostic(
  dependency: PackageJsonDependency,
  stats: PackageStats,
  targetLicense: string,
): vscode.Diagnostic | null {
  if (!stats.licenseCompatibility || stats.licenseCompatibility.isCompatible) {
    return null;
  }
  const licenseName = stats.license ?? "unknown";
  const explanation = stats.licenseCompatibility.explanation
    ? ` ${stats.licenseCompatibility.explanation}`
    : "";
  const diagnostic = new vscode.Diagnostic(
    dependency.nameRange,
    `${dependency.name} is licensed ${licenseName}, which is not compatible with ${targetLicense}.${explanation}`,
    vscode.DiagnosticSeverity.Warning,
  );
  diagnostic.source = "npm-advisor";
  diagnostic.code = "license-incompatible";
  return diagnostic;
}

/**
 * Warning-severity diagnostic when GitHub reports no commits to the
 * dependency's repository within the configured threshold (default
 * 730 days). Skipped when last-commit data is missing or unparseable.
 */
function buildUnmaintainedDiagnostic(
  dependency: PackageJsonDependency,
  stats: PackageStats,
  thresholdDays: number,
  now: Date,
): vscode.Diagnostic | null {
  if (!stats.lastCommitDate) {
    return null;
  }
  const lastCommit = new Date(stats.lastCommitDate);
  if (Number.isNaN(lastCommit.getTime())) {
    return null;
  }
  const ageDays = Math.floor(
    (now.getTime() - lastCommit.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (ageDays < thresholdDays) {
    return null;
  }
  const ageText =
    ageDays >= 365
      ? `${Math.floor(ageDays / 365)} year${ageDays >= 730 ? "s" : ""}`
      : `${ageDays} days`;
  const diagnostic = new vscode.Diagnostic(
    dependency.nameRange,
    `${dependency.name} appears unmaintained — last commit was ${ageText} ago.`,
    vscode.DiagnosticSeverity.Warning,
  );
  diagnostic.source = "npm-advisor";
  diagnostic.code = "unmaintained";
  return diagnostic;
}
