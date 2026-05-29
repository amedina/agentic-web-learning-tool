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
import { logError, logInfo } from "../services/logger";
import type { ProjectAnalysisCache } from "./projectAnalysisCache";

const DIAGNOSTIC_SOURCE = "npm-advisor (project)";

/**
 * Upper bound on a single analysis run. publint, the replacements scan,
 * and madge's circular-dependency walk all run without internal time
 * limits; on a pathological project (huge source tree, symlink loops,
 * a stalled manifest fetch) any one of them can hang indefinitely, which
 * left the webview spinner and the command progress notification stuck
 * forever. The timeout turns that into a surfaced error instead.
 */
const ANALYSIS_TIMEOUT_MS = 90_000;

export interface ProjectAnalysisOptions {
  /** Absolute path to the project root that contains package.json. */
  rootPath: string;
  /** Forwarded to the underlying publint run. Defaults to "source". */
  publintMode?: "source" | "pack";
  /**
   * Optional cache. When provided, the entry for `rootPath` is
   * invalidated before the run starts and the fresh analysis is
   * stored on success — so subsequent webview / command invocations
   * for the same root re-use the cached object until the TTL expires.
   */
  cache?: ProjectAnalysisCache;
}

export interface ProjectAnalysisRunResult {
  analysis: ProjectAnalysis;
  /** Number of diagnostics actually written to the collection. */
  diagnosticsWritten: number;
}

/**
 * Runs `analyzeProject` for the given root, opens its package.json so we
 * can resolve precise ranges for each finding, and writes the resulting
 * diagnostics to `collection`. Publint and replacement findings are keyed
 * by the package.json URI; circular-dependency findings are keyed by the
 * first source file in the cycle so they show up next to the offending
 * import in the Problems panel. Returns the raw analysis alongside a
 * count, so the caller (the command handler) can show a meaningful
 * "found N issues" toast.
 */
export async function runProjectAnalysis(
  collection: vscode.DiagnosticCollection,
  options: ProjectAnalysisOptions,
): Promise<ProjectAnalysisRunResult> {
  options.cache?.invalidate(options.rootPath);

  logInfo(`Project analysis started for ${options.rootPath}`);
  const startedAt = Date.now();

  let analysis: ProjectAnalysis;
  try {
    analysis = await withTimeout(
      analyzeProject({
        rootPath: options.rootPath,
        publintMode: options.publintMode ?? "source",
      }),
      ANALYSIS_TIMEOUT_MS,
      `Project analysis for ${options.rootPath} timed out after ${ANALYSIS_TIMEOUT_MS / 1000}s`,
    );
  } catch (error) {
    logError(`Project analysis failed for ${options.rootPath}`, error);
    throw error;
  }

  const elapsedMs = Date.now() - startedAt;
  logInfo(
    `Project analysis finished for ${options.rootPath} in ${elapsedMs}ms — ${analysis.findings.length} finding(s)` +
      (analysis.warnings.length > 0
        ? `, ${analysis.warnings.length} warning(s): ${analysis.warnings.join("; ")}`
        : ""),
  );

  options.cache?.set(options.rootPath, analysis);

  const packageJsonUri = vscode.Uri.file(`${options.rootPath}/package.json`);
  let document: vscode.TextDocument | undefined;
  try {
    document = await vscode.workspace.openTextDocument(packageJsonUri);
  } catch {
    document = undefined;
  }

  collection.clear();

  const packageJsonDiagnostics: vscode.Diagnostic[] = [];
  const fileDiagnostics = new Map<string, vscode.Diagnostic[]>();
  let diagnosticsWritten = 0;

  for (const finding of analysis.findings) {
    if (finding.source === "circular-deps" && finding.file) {
      const diagnostic = buildCircularDiagnostic(finding);
      const existing = fileDiagnostics.get(finding.file) ?? [];
      existing.push(diagnostic);
      fileDiagnostics.set(finding.file, existing);
      diagnosticsWritten += 1;
      continue;
    }
    const diagnostic = buildDiagnostic(finding, document);
    if (!diagnostic) {
      continue;
    }
    packageJsonDiagnostics.push(diagnostic);
    diagnosticsWritten += 1;
  }

  collection.set(packageJsonUri, packageJsonDiagnostics);
  for (const [filePath, diagnostics] of fileDiagnostics) {
    collection.set(vscode.Uri.file(filePath), diagnostics);
  }

  return { analysis, diagnosticsWritten };
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
 * Builds a diagnostic for a circular-dependency finding. The range is
 * pinned to the start of the source file the cycle was reported against;
 * a precise import-statement location would require parsing the file,
 * which is beyond what this runner does today.
 */
function buildCircularDiagnostic(finding: ProjectFinding): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(
    zeroRange(),
    finding.message,
    severityFor(finding.severity),
  );
  diagnostic.source = DIAGNOSTIC_SOURCE;
  diagnostic.code = finding.code;
  return diagnostic;
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

/**
 * Rejects with `message` if `promise` hasn't settled within `timeoutMs`.
 * The underlying work (madge, publint, the manifest fetch) can't be
 * cancelled, so it keeps running in the background after a timeout — but
 * the caller's await unblocks and surfaces a real error instead of
 * spinning forever. The timer is cleared on settle so a resolved run
 * doesn't leak a pending handle.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
