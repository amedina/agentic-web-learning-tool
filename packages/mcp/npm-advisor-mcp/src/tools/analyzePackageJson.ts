/**
 * External dependencies.
 */
import { dirname, resolve } from "node:path";
import {
  getPackageStats,
  type PackageStats,
} from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { readPackageJsonDependencies } from "../workspace/findPackageJsonFiles";
import {
  findAndParseLockfile,
  parseLockfileAtPath,
  type DiscoveredLockfile,
} from "../workspace/findLockfile";

const CONCURRENCY = 3;

export interface AnalyzePackageJsonInput {
  /** Absolute or cwd-relative path to the package.json file to analyze. */
  packageJsonPath: string;
  /** SPDX license id of the consuming project, used for license-compat verdicts. */
  targetLicense?: string;
  /**
   * Absolute path to a lockfile to use for resolved-version lookups.
   * Overrides the upward walk from `packageJsonPath`'s directory.
   * Useful when the lockfile sits outside the natural walk target —
   * e.g. a vendored fixture or a monorepo with non-standard layout.
   */
  lockfilePath?: string;
}

export interface AnalyzedDependency {
  name: string;
  category: "dependencies" | "devDependencies" | "peerDependencies";
  stats: PackageStats | null;
  /** Populated when the analyzer threw — usually a network error. */
  error?: string;
}

export interface AnalyzePackageJsonOutput {
  /** Resolved absolute path of the package.json that was read. */
  packageJsonPath: string;
  /** Parsed `name` field of the package.json. */
  name: string | null;
  /**
   * Path to the lockfile used for resolved-version lookups, when one
   * was found. `null` when no lockfile was discovered or when the file
   * was unsupported.
   */
  lockfilePath: string | null;
  /**
   * `"lockfile"` when at least one dep was resolved from the lockfile;
   * `"latest-fallback"` when no lockfile was used (the analyzer ran
   * against `dist-tags.latest` for every dep). Surfaced so the LLM
   * can warn users that latest-fallback verdicts may not match their
   * installed versions.
   */
  versionResolution: "lockfile" | "latest-fallback";
  /** Per-dependency analysis result. Empty when the file has no deps. */
  dependencies: AnalyzedDependency[];
  /** High-level counts so the AI can summarize without iterating. */
  summary: {
    total: number;
    analyzed: number;
    notFound: number;
    failed: number;
    withVulnerabilities: number;
    withLicenseIssues: number;
    withRecommendations: number;
  };
}

/**
 * Tool handler for `analyze_package_json`. Reads the file, fetches
 * stats for every dep with a small concurrency pool, and rolls up
 * counts the AI can describe in one breath. The concurrency pool
 * matches the value the chrome / vscode dependencies tab uses so
 * we hit GitHub/npm at the same intensity those clients do.
 */
export async function runAnalyzePackageJson(
  input: AnalyzePackageJsonInput,
): Promise<AnalyzePackageJsonOutput> {
  const packageJsonPath = resolve(input.packageJsonPath);
  const targetLicense = input.targetLicense ?? "MIT";

  const lockfile = await resolveLockfile(packageJsonPath, input.lockfilePath);
  const topLevel = lockfile?.parsed.topLevel ?? {};

  const parsed = await readPackageJsonDependencies(packageJsonPath);
  const queue: { name: string; category: AnalyzedDependency["category"] }[] = [
    ...parsed.dependencies.map((name) => ({
      name,
      category: "dependencies" as const,
    })),
    ...parsed.devDependencies.map((name) => ({
      name,
      category: "devDependencies" as const,
    })),
    ...parsed.peerDependencies.map((name) => ({
      name,
      category: "peerDependencies" as const,
    })),
  ];

  const dependencies: AnalyzedDependency[] = await runConcurrent(
    queue,
    CONCURRENCY,
    async ({ name, category }) => {
      try {
        const stats = await getPackageStats(name, targetLicense, {
          includeDependencyTree: false,
          resolvedVersion: topLevel[name],
        });
        return { name, category, stats };
      } catch (error) {
        return {
          name,
          category,
          stats: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );

  return {
    packageJsonPath,
    name: parsed.name,
    lockfilePath: lockfile?.path ?? null,
    versionResolution: lockfile ? "lockfile" : "latest-fallback",
    dependencies,
    summary: summarize(dependencies),
  };
}

/**
 * Resolve which lockfile to use for version lookups. When the caller
 * provides an explicit path it wins; otherwise walk up from the
 * package.json's directory. Returns `null` when no usable lockfile is
 * found, which the caller treats as `latest-fallback`.
 */
async function resolveLockfile(
  packageJsonPath: string,
  override: string | undefined,
): Promise<DiscoveredLockfile | null> {
  if (override) {
    return parseLockfileAtPath(resolve(override));
  }
  return findAndParseLockfile(dirname(packageJsonPath));
}

/**
 * Runs `worker` over `items` with at most `limit` calls in flight at
 * once. Preserves input order in the output so the caller can correlate
 * results with the original list.
 */
async function runConcurrent<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runOne = async (): Promise<void> => {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await worker(items[index]);
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, runOne);
  await Promise.all(workers);
  return results;
}

/**
 * Aggregates per-dep results into a small summary object. Counts a
 * dep as "analyzed" only when stats came back; null stats land in
 * notFound or failed depending on whether an error was attached.
 */
function summarize(
  deps: AnalyzedDependency[],
): AnalyzePackageJsonOutput["summary"] {
  let analyzed = 0;
  let notFound = 0;
  let failed = 0;
  let withVulnerabilities = 0;
  let withLicenseIssues = 0;
  let withRecommendations = 0;
  for (const dep of deps) {
    if (dep.stats) {
      analyzed += 1;
      const advisories = dep.stats.securityAdvisories;
      if (
        advisories &&
        advisories.critical +
          advisories.high +
          advisories.moderate +
          advisories.low >
          0
      ) {
        withVulnerabilities += 1;
      }
      if (dep.stats.licenseCompatibility?.isCompatible === false) {
        withLicenseIssues += 1;
      }
      const recommendations = dep.stats.recommendations;
      const recCount =
        (recommendations?.nativeReplacements?.length ?? 0) +
        (recommendations?.preferredReplacements?.length ?? 0) +
        (recommendations?.microUtilityReplacements?.length ?? 0);
      if (recCount > 0) {
        withRecommendations += 1;
      }
    } else if (dep.error) {
      failed += 1;
    } else {
      notFound += 1;
    }
  }
  return {
    total: deps.length,
    analyzed,
    notFound,
    failed,
    withVulnerabilities,
    withLicenseIssues,
    withRecommendations,
  };
}
