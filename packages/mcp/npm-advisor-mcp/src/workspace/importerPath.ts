/**
 * External dependencies.
 */
import { dirname, relative, sep } from "node:path";

/**
 * Compute the importer path for a package.json relative to a lockfile,
 * in the form pnpm uses inside `pnpm-lock.yaml` `importers` keys: a posix
 * path relative to the lockfile's directory, with `.` for the package
 * that sits alongside the lockfile.
 *
 * In a pnpm workspace the single root lockfile keys every member package
 * by its path relative to the root, so this lets callers look up the
 * exact importer a dependency was declared in.
 *
 * @param lockfilePath - Absolute path to the lockfile.
 * @param packageJsonPath - Absolute path to the package.json being resolved.
 * @returns The importer path (`.` for the root, otherwise a posix-relative path).
 */
export function importerPathFor(
  lockfilePath: string,
  packageJsonPath: string,
): string {
  const relativePath = relative(dirname(lockfilePath), dirname(packageJsonPath));
  if (!relativePath) {
    return ".";
  }
  return relativePath.split(sep).join("/");
}
