/**
 * External dependencies.
 */
import {
  analyzeProject,
  type ProjectAnalysis,
} from "@agentic-web-labs/project-analyzer-core";
import { resolve } from "node:path";

export interface AnalyzeProjectInput {
  /** Absolute or cwd-relative path to the project root (the directory that contains package.json). */
  rootPath: string;
  /**
   * Publint mode. "source" keeps the run cheap (the default and right
   * choice for repeated editor-style invocations); "pack" runs the
   * project's package manager to produce a tarball first and lints what
   * would actually ship — slower but matches publint.dev / e18e-cli.
   */
  publintMode?: "source" | "pack";
  /** Skip the publint analyzer. */
  skipPublint?: boolean;
  /** Skip the replacement-opportunities analyzer. */
  skipReplacements?: boolean;
}

/**
 * Tool handler for `analyze_project`. Resolves `rootPath` against the
 * server process's cwd (so callers can pass a relative path when the
 * server is launched in the project root) and delegates to the shared
 * `analyzeProject` orchestrator. Returns the ProjectAnalysis verbatim
 * so MCP clients can iterate findings without a second mapping step.
 */
export async function runAnalyzeProject(
  input: AnalyzeProjectInput,
): Promise<ProjectAnalysis> {
  const rootPath = resolve(input.rootPath);
  return analyzeProject({
    rootPath,
    publintMode: input.publintMode,
    skipPublint: input.skipPublint,
    skipReplacements: input.skipReplacements,
  });
}
