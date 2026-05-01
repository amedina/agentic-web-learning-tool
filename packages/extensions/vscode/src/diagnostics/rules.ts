/**
 * Internal dependencies.
 */
import type { PackageJsonDependency } from "../packageJson/parse";
import {
  isAtOrAboveFloor,
  type AdvisorySeverity,
  type NpmAdvisorSettings,
} from "./settings";

/**
 * External dependencies.
 */
import * as vscode from "vscode";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

export interface EvaluateOptions {
  now?: () => Date;
}

const ADVISORY_SEVERITIES: AdvisorySeverity[] = [
  "critical",
  "high",
  "moderate",
  "low",
];

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

  return diagnostics;
}

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
    `${dependency.name} has security advisories: ${summary}.`,
    vscode.DiagnosticSeverity.Error,
  );
  diagnostic.source = "npm-advisor";
  diagnostic.code = "security-advisory";
  return diagnostic;
}

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
