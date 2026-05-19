/**
 * Internal dependencies.
 */
import type {
  FindingSeverity,
  FindingSource,
  ProjectAnalysis,
  ProjectFinding,
} from "../types";
import { detectPackageManager } from "../utils/detectPackageManager";
import {
  findCircularDependencies,
  type FindCircularDependenciesOptions,
} from "./findCircularDependencies";
import {
  findReplacementOpportunities,
  type FindReplacementOpportunitiesOptions,
} from "./findReplacementOpportunities";
import { runPublint, type PublintMode } from "./runPublint";

export interface AnalyzeProjectOptions {
  /** Absolute path to the project root that contains `package.json`. */
  rootPath: string;
  /**
   * Publint mode. `"source"` (default) keeps the run cheap for editor use;
   * `"pack"` runs the package manager to produce a tarball first and lints
   * what would actually ship.
   */
  publintMode?: PublintMode;
  /**
   * Skip publint entirely. Useful for callers that only want the
   * replacement-opportunities surface (e.g. an MCP tool focused on deps).
   */
  skipPublint?: boolean;
  /**
   * Skip the replacement-opportunities scan. Useful when the caller only
   * wants the publint surface.
   */
  skipReplacements?: boolean;
  /**
   * Skip the circular-dependency scan. Useful when the caller only
   * wants the publint and/or replacements surfaces.
   */
  skipCircularDependencies?: boolean;
  /**
   * Forwarded to `findReplacementOpportunities` so tests can inject a
   * fixture manifest without a network round-trip.
   */
  replacementsManifestProvider?: FindReplacementOpportunitiesOptions["manifestProvider"];
  /**
   * Forwarded to `findCircularDependencies` so callers can override
   * the source directory or file extensions used by the scan.
   */
  circularDependenciesOptions?: Omit<
    FindCircularDependenciesOptions,
    "rootPath"
  >;
}

/**
 * Builds the per-severity / per-source counts that `ProjectAnalysis.summary`
 * exposes. Initialising every key explicitly keeps the JSON serialisation
 * stable for MCP responses and for the VS Code webview.
 */
function summarise(findings: ProjectFinding[]): ProjectAnalysis["summary"] {
  const bySeverity: Record<FindingSeverity, number> = {
    error: 0,
    warning: 0,
    info: 0,
    hint: 0,
  };
  const bySource: Record<FindingSource, number> = {
    publint: 0,
    replacements: 0,
    "circular-deps": 0,
  };
  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
    bySource[finding.source] += 1;
  }
  return { total: findings.length, bySeverity, bySource };
}

/**
 * Top-level orchestrator. Runs the configured analyzers in parallel and
 * returns a unified `ProjectAnalysis`. Soft failures (manifest fetch
 * failed, publint crashed mid-run) are surfaced as `warnings`; only a
 * fundamentally invalid `rootPath` (one we can't read) propagates as a
 * thrown error from publint. Callers that need bullet-proof handling
 * should wrap the call themselves.
 */
export async function analyzeProject(
  options: AnalyzeProjectOptions,
): Promise<ProjectAnalysis> {
  const {
    rootPath,
    publintMode = "source",
    skipPublint = false,
    skipReplacements = false,
    skipCircularDependencies = false,
    replacementsManifestProvider,
    circularDependenciesOptions,
  } = options;

  const warnings: string[] = [];

  const [packageManager, publintResult, replacementsResult, circularResult] =
    await Promise.all([
      detectPackageManager(rootPath).catch(() => undefined),
      skipPublint
        ? Promise.resolve(null)
        : runPublint({ pkgDir: rootPath, mode: publintMode }).catch(
            (error: Error) => {
              warnings.push(`publint failed: ${error.message}`);
              return null;
            },
          ),
      skipReplacements
        ? Promise.resolve(null)
        : findReplacementOpportunities({
            rootPath,
            manifestProvider: replacementsManifestProvider,
          }),
      skipCircularDependencies
        ? Promise.resolve(null)
        : findCircularDependencies({
            rootPath,
            ...circularDependenciesOptions,
          }).catch((error: Error) => {
            warnings.push(`circular-dependency scan failed: ${error.message}`);
            return null;
          }),
    ]);

  const findings: ProjectFinding[] = [];
  if (publintResult) {
    findings.push(...publintResult.findings);
  }
  if (replacementsResult) {
    findings.push(...replacementsResult.findings);
    warnings.push(...replacementsResult.warnings);
  }
  if (circularResult) {
    findings.push(...circularResult.findings);
    warnings.push(...circularResult.warnings);
  }

  return {
    rootPath,
    packageManager,
    findings,
    summary: summarise(findings),
    warnings,
  };
}
