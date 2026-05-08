/**
 * External dependencies.
 */
import * as vscode from "vscode";
import {
  analyzeProject,
  type ProjectAnalysis,
  type ProjectFinding,
} from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { findRangeForJsonPath } from "../packageJson/findRangeForJsonPath";
import { parseDependencies } from "../packageJson/parse";

const DIAGNOSTIC_SOURCE = "npm-advisor (project)";

export interface ProjectAnalysisOptions {
  /** Absolute path to the project root that contains package.json. */
  rootPath: string;
  /** Forwarded to the underlying publint run. Defaults to "source". */
  publintMode?: "source" | "pack";
}

export interface ProjectAnalysisRunResult {
  analysis: ProjectAnalysis;
  /** Number of diagnostics actually written to the collection. */
  diagnosticsWritten: number;
}

/**
 * Runs `analyzeProject` for the given root, opens its package.json so we
 * can resolve precise ranges for each finding, and writes the resulting
 * diagnostics to `collection` keyed by the package.json URI. Returns the
 * raw analysis alongside a count, so the caller (the command handler)
 * can show a meaningful "found N issues" toast.
 */
export async function runProjectAnalysis(
  collection: vscode.DiagnosticCollection,
  options: ProjectAnalysisOptions,
): Promise<ProjectAnalysisRunResult> {
  const analysis = await analyzeProject({
    rootPath: options.rootPath,
    publintMode: options.publintMode ?? "source",
  });

  const packageJsonUri = vscode.Uri.file(`${options.rootPath}/package.json`);
  let document: vscode.TextDocument | undefined;
  try {
    document = await vscode.workspace.openTextDocument(packageJsonUri);
  } catch {
    document = undefined;
  }

  const diagnostics = analysis.findings
    .map((finding) => buildDiagnostic(finding, document))
    .filter((diagnostic): diagnostic is vscode.Diagnostic =>
      Boolean(diagnostic),
    );

  collection.set(packageJsonUri, diagnostics);
  return { analysis, diagnosticsWritten: diagnostics.length };
}

/**
 * Drops every diagnostic this runner has previously written. Used by
 * the "Clear project analysis" command so the user can dismiss results
 * without re-running.
 */
export function clearProjectAnalysis(
  collection: vscode.DiagnosticCollection,
): void {
  collection.clear();
}

/**
 * Maps a `ProjectFinding` to a `vscode.Diagnostic`. Resolves the range
 * differently depending on the source: publint findings use the JSON
 * path stashed on `data.publintPath`; replacement findings target the
 * dependency name in the `dependencies`/`devDependencies` block. When
 * no range can be resolved, falls back to the start of the document
 * (line 0 char 0) so the diagnostic still appears in the Problems panel.
 */
function buildDiagnostic(
  finding: ProjectFinding,
  document: vscode.TextDocument | undefined,
): vscode.Diagnostic | undefined {
  const range = resolveRange(finding, document) ?? zeroRange();
  const diagnostic = new vscode.Diagnostic(
    range,
    finding.message,
    severityFor(finding.severity),
  );
  diagnostic.source = DIAGNOSTIC_SOURCE;
  diagnostic.code = finding.code;
  return diagnostic;
}

/**
 * Tries to map a finding back to a precise location inside package.json.
 * Returns undefined when the document isn't available or when the
 * finding's locator can't be resolved (e.g. the package.json was edited
 * between the analysis and this call).
 */
function resolveRange(
  finding: ProjectFinding,
  document: vscode.TextDocument | undefined,
): vscode.Range | undefined {
  if (!document) {
    return undefined;
  }
  if (finding.source === "publint") {
    const path =
      (finding.data?.publintPath as (string | number)[] | undefined) ?? [];
    if (path.length === 0) {
      return undefined;
    }
    return findRangeForJsonPath(document, path);
  }
  if (finding.source === "replacements") {
    const packageName = finding.data?.packageName;
    if (typeof packageName !== "string") {
      return undefined;
    }
    const dependency = parseDependencies(document).find(
      (entry) => entry.name === packageName,
    );
    return dependency?.nameRange;
  }
  return undefined;
}

/**
 * Maps the abstract severity vocabulary used by `ProjectFinding` to the
 * concrete `vscode.DiagnosticSeverity` enum.
 */
function severityFor(
  severity: ProjectFinding["severity"],
): vscode.DiagnosticSeverity {
  switch (severity) {
    case "error":
      return vscode.DiagnosticSeverity.Error;
    case "warning":
      return vscode.DiagnosticSeverity.Warning;
    case "info":
      return vscode.DiagnosticSeverity.Information;
    case "hint":
    default:
      return vscode.DiagnosticSeverity.Hint;
  }
}

/** Returns a zero-length range pinned to the start of the document. */
function zeroRange(): vscode.Range {
  return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
}
