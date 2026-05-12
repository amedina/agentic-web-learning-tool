/**
 * External dependencies.
 */
import {
  getPackageStats,
  type PackageStats,
} from "@agentic-web-labs/package-analyzer-core";

export interface GetPackageStatsInput {
  /** npm package name, e.g. "lodash" or "@types/node". */
  name: string;
  /** SPDX license id of the consuming project, used for compatibility verdicts. */
  targetLicense?: string;
  /** Whether to include the recursive dependency tree (slower, large output). */
  includeDependencyTree?: boolean;
}

export interface GetPackageStatsOutput {
  /** The full PackageStats payload from analyzer-core, or null when the package isn't on npm. */
  stats: PackageStats | null;
}

/**
 * Tool handler for `get_package_stats`. Thin wrapper around analyzer-core's
 * getPackageStats so the same scoring / license / advisory pipeline that
 * powers the VSCode extension and the Chrome extension also powers any
 * MCP-aware AI client. Defaults dependency-tree off because it's slow
 * and most chat questions don't need it; clients can opt in per call.
 */
export async function runGetPackageStats(
  input: GetPackageStatsInput,
): Promise<GetPackageStatsOutput> {
  const stats = await getPackageStats(
    input.name,
    input.targetLicense ?? "MIT",
    {
      includeDependencyTree: input.includeDependencyTree ?? false,
    },
  );
  return { stats };
}
