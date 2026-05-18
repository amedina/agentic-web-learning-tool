/**
 * External dependencies.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, parse, resolve } from "node:path";

/**
 * Walks up from `startDir` looking for the nearest directory that
 * looks like an npm / yarn / pnpm workspace root. A directory
 * qualifies when it contains either a `pnpm-workspace.yaml` or a
 * `package.json` whose `workspaces` field is an array (flat npm /
 * yarn workspaces) or an object with a `packages` array (yarn
 * nohoist style). Returns null when no marker is found before
 * reaching the filesystem root.
 *
 * Lets `list_workspace_dependencies` expand the default scan from
 * "this one sub-package" to "every package the monorepo declares"
 * when an AI client calls the tool without an explicit path.
 */
export async function findWorkspaceRoot(
  startDir: string,
): Promise<string | null> {
  const startResolved = resolve(startDir);
  const filesystemRoot = parse(startResolved).root;
  let current = startResolved;
  while (true) {
    if (await isWorkspaceRoot(current)) {
      return current;
    }
    if (current === filesystemRoot) {
      return null;
    }
    current = dirname(current);
  }
}

/**
 * Returns true when `directory` contains a marker file that
 * indicates an npm-style monorepo workspace root.
 */
async function isWorkspaceRoot(directory: string): Promise<boolean> {
  if (existsSync(join(directory, "pnpm-workspace.yaml"))) {
    return true;
  }
  const packageJsonPath = join(directory, "package.json");
  if (!existsSync(packageJsonPath)) {
    return false;
  }
  try {
    const text = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(text) as { workspaces?: unknown };
    return hasWorkspacesField(parsed.workspaces);
  } catch {
    return false;
  }
}

/**
 * Validates that a parsed `workspaces` field has a canonical shape:
 * either a flat array of globs (npm / yarn / pnpm) or an object
 * with a `packages` array (yarn nohoist).
 */
function hasWorkspacesField(value: unknown): boolean {
  if (Array.isArray(value)) {
    return true;
  }
  if (value && typeof value === "object") {
    const maybePackages = (value as { packages?: unknown }).packages;
    return Array.isArray(maybePackages);
  }
  return false;
}
