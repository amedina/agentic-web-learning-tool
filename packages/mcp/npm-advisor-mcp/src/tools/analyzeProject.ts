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
  /** Skip the publint analyzer. */
  skipPublint?: boolean;
  /** Skip the replacement-opportunities analyzer. */
  skipReplacements?: boolean;
}

/**
 * Tool handler for `analyze_project`. Resolves `rootPath` against the
 * server process's cwd (so callers can pass a relative path when the
 * server is launched in the project root) and delegates to the shared
 * `analyzeProject` orchestrator. publint always runs in its `"source"`
 * mode (the orchestrator default), which keeps repeated editor-style
 * invocations cheap. Returns the ProjectAnalysis verbatim so MCP clients
 * can iterate findings without a second mapping step.
 */
export async function runAnalyzeProject(
  input: AnalyzeProjectInput,
): Promise<ProjectAnalysis> {
  const rootPath = resolve(input.rootPath);
  return analyzeProject({
    rootPath,
    skipPublint: input.skipPublint,
    skipReplacements: input.skipReplacements,
  });
}
