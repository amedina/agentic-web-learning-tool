/**
 * External dependencies.
 */
import { resolve } from "node:path";

/**
 * Internal dependencies.
 */
import {
  findPackageJsonFiles,
  type PackageJsonFile,
} from "../workspace/findPackageJsonFiles";
import { findWorkspaceRoot } from "../workspace/findWorkspaceRoot";

export interface ListWorkspaceDependenciesInput {
  /**
   * Absolute or cwd-relative path to scan. When omitted the tool
   * auto-ascends from process.cwd() to the nearest monorepo
   * workspace root (pnpm-workspace.yaml or `package.json#workspaces`)
   * so a single call returns every package the monorepo declares.
   */
  workspacePath?: string;
}

export interface ListWorkspaceDependenciesOutput {
  /** Resolved absolute path that was actually scanned. */
  scannedPath: string;
  /** Every package.json discovered, with its name and dependency counts. */
  files: PackageJsonFile[];
  /**
   * When `scannedPath` is a sub-package inside an npm / yarn / pnpm
   * workspace, this is the absolute path of the surrounding
   * workspace root. The MCP client can call this tool again with
   * `workspacePath` set to this value to enumerate every package
   * the monorepo declares. Null when `scannedPath` is already a
   * workspace root or isn't inside one.
   */
  workspaceRoot: string | null;
}

/**
 * Tool handler for `list_workspace_dependencies`. Lightweight: just
 * walks the filesystem to find package.json files and reads their
 * `name` + dep counts. No network calls — useful for the AI to "see"
 * the project layout before drilling into specific packages. When
 * called without `workspacePath`, ascends from process.cwd() to the
 * surrounding monorepo workspace root so the default behaviour
 * returns the whole project, not just the sub-package the server
 * happened to be launched from.
 */
export async function runListWorkspaceDependencies(
  input: ListWorkspaceDependenciesInput,
): Promise<ListWorkspaceDependenciesOutput> {
  const explicit = input.workspacePath ? resolve(input.workspacePath) : null;
  const detectedFromCwd = explicit
    ? null
    : await findWorkspaceRoot(process.cwd());
  const scannedPath = explicit ?? detectedFromCwd ?? resolve(process.cwd());
  const files = await findPackageJsonFiles(scannedPath);
  const ancestorRoot = await findWorkspaceRoot(scannedPath);
  const workspaceRoot =
    ancestorRoot && ancestorRoot !== scannedPath ? ancestorRoot : null;
  return { scannedPath, files, workspaceRoot };
}
