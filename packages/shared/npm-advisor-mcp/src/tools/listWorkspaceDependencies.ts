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
} from "../workspace/findPackageJsonFiles.ts";

export interface ListWorkspaceDependenciesInput {
  /** Absolute or cwd-relative path to scan. Defaults to process.cwd(). */
  workspacePath?: string;
}

export interface ListWorkspaceDependenciesOutput {
  /** Resolved absolute path that was actually scanned. */
  scannedPath: string;
  /** Every package.json discovered, with its name and dependency counts. */
  files: PackageJsonFile[];
}

/**
 * Tool handler for `list_workspace_dependencies`. Lightweight: just
 * walks the filesystem to find package.json files and reads their
 * `name` + dep counts. No network calls — useful for the AI to "see"
 * the project layout before drilling into specific packages.
 */
export async function runListWorkspaceDependencies(
  input: ListWorkspaceDependenciesInput,
): Promise<ListWorkspaceDependenciesOutput> {
  const scannedPath = resolve(input.workspacePath ?? process.cwd());
  const files = await findPackageJsonFiles(scannedPath);
  return { scannedPath, files };
}
