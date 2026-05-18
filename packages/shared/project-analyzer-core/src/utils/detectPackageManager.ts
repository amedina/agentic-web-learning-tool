/**
 * External dependencies.
 */
import { detect } from "package-manager-detector";

export type DetectedPackageManager = "npm" | "pnpm" | "yarn" | "bun" | "deno";

/**
 * Detects the package manager used by a project rooted at `pkgDir`.
 *
 * Uses `package-manager-detector`, which inspects lockfiles and the
 * `packageManager` field. Returns `undefined` when nothing can be inferred
 * (e.g. a brand-new project with no lockfile yet).
 *
 * @param pkgDir Absolute path to the project root.
 */
export async function detectPackageManager(
  pkgDir: string,
): Promise<DetectedPackageManager | undefined> {
  const result = await detect({ cwd: pkgDir });
  if (!result) {
    return undefined;
  }
  const name = result.name;
  if (
    name === "npm" ||
    name === "pnpm" ||
    name === "yarn" ||
    name === "bun" ||
    name === "deno"
  ) {
    return name;
  }
  return undefined;
}
