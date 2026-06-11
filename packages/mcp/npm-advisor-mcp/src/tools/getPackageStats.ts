/**
 * External dependencies.
 */
import { dirname, resolve } from "node:path";
import {
  getPackageStats,
  resolutionsForImporter,
  type PackageStats,
} from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import {
  findAndParseLockfile,
  parseLockfileAtPath,
  type DiscoveredLockfile,
} from "../workspace/findLockfile";
import { importerPathFor } from "../workspace/importerPath";

export interface GetPackageStatsInput {
  /** npm package name, e.g. "lodash" or "@types/node". */
  name: string;
  /** SPDX license id of the consuming project, used for compatibility verdicts. */
  targetLicense?: string;
  /** Whether to include the recursive dependency tree (slower, large output). */
  includeDependencyTree?: boolean;
  /**
   * Explicit installed version. When set, advisory matching and
   * version-sensitive lookups in analyzer-core run against this version
   * rather than `dist-tags.latest`. Useful when the caller already
   * knows what the user has installed.
   */
  resolvedVersion?: string;
  /**
   * Absolute path to a package.json. When provided (and
   * `resolvedVersion` is not), the tool walks up from this file's
   * directory to find the nearest lockfile and looks up the dep
   * version there. Lets MCP clients ask "stats for this package as
   * installed in this project" with one call.
   */
  packageJsonPath?: string;
  /**
   * Absolute path to a specific lockfile to use for the lookup,
   * overriding the upward walk from `packageJsonPath`'s directory.
   * Ignored when `resolvedVersion` is set.
   */
  lockfilePath?: string;
}

export interface GetPackageStatsOutput {
  /** The full PackageStats payload from analyzer-core, or null when the package isn't on npm. */
  stats: PackageStats | null;
  /**
   * Path to the lockfile used to resolve the version, when one was
   * read. `null` when no lockfile path was provided / discovered.
   */
  lockfilePath: string | null;
}

/**
 * Tool handler for `get_package_stats`. Thin wrapper around analyzer-core's
 * getPackageStats so the same scoring / license / advisory pipeline that
 * powers the VSCode extension and the Chrome extension also powers any
 * MCP-aware AI client. Defaults dependency-tree off because it's slow
 * and most chat questions don't need it; clients can opt in per call.
 *
 * Resolved-version resolution priority:
 * 1. `input.resolvedVersion` when set by the caller.
 * 2. Lookup in the file at `input.lockfilePath` when set.
 * 3. Lookup in the nearest lockfile above `input.packageJsonPath` when
 *    set.
 * 4. Otherwise omitted — analyzer-core falls back to
 *    `dist-tags.latest` and the response flags `latest-fallback` on
 *    its `versionResolution` field.
 */
export async function runGetPackageStats(
  input: GetPackageStatsInput,
): Promise<GetPackageStatsOutput> {
  const { resolvedVersion, lockfilePath } =
    await resolveVersionFromInput(input);
  const stats = await getPackageStats(
    input.name,
    input.targetLicense ?? "MIT",
    {
      includeDependencyTree: input.includeDependencyTree ?? false,
      resolvedVersion,
    },
  );
  return { stats, lockfilePath };
}

/**
 * Decide what version (if any) to pass into analyzer-core. Honours an
 * explicit `resolvedVersion` first; otherwise reads the lockfile (from
 * `lockfilePath` or by walking up from `packageJsonPath`) and looks the
 * dep up there. Returns `{ resolvedVersion: undefined }` when nothing
 * was found, which leaves analyzer-core to fall back to latest.
 */
async function resolveVersionFromInput(
  input: GetPackageStatsInput,
): Promise<{ resolvedVersion?: string; lockfilePath: string | null }> {
  if (input.resolvedVersion) {
    return {
      resolvedVersion: input.resolvedVersion,
      lockfilePath: input.lockfilePath ?? null,
    };
  }
  let lockfile: DiscoveredLockfile | null = null;
  if (input.lockfilePath) {
    lockfile = await parseLockfileAtPath(resolve(input.lockfilePath));
  } else if (input.packageJsonPath) {
    lockfile = await findAndParseLockfile(
      dirname(resolve(input.packageJsonPath)),
    );
  }
  if (!lockfile) {
    return { lockfilePath: null };
  }
  const importerPath = input.packageJsonPath
    ? importerPathFor(lockfile.path, resolve(input.packageJsonPath))
    : ".";
  return {
    resolvedVersion: resolutionsForImporter(lockfile.parsed, importerPath)[
      input.name
    ],
    lockfilePath: lockfile.path,
  };
}
