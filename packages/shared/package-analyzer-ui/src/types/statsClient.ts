/**
 * External dependencies.
 */
import {
  type DependencyCategory,
  type PackageStats,
  type DependencyTree,
} from "@google-awlt/package-analyzer-core";

export type BundleData = NonNullable<PackageStats["bundle"]>;

/**
 * Abstraction over the data-fetching layer so UI components are decoupled
 * from the Chrome runtime. Each consumer (Chrome ext, VS Code ext, CLI)
 * provides its own implementation.
 */
export interface StatsClient {
  /**
   * Returns lightweight stats for a package (no dependency tree). Resolves
   * to null when the package is not found. Throws on network/API errors.
   */
  getLightStats(
    name: string,
    category: DependencyCategory,
  ): Promise<PackageStats | null>;

  /**
   * Returns bundlephobia data for a package. Resolves to null when
   * unavailable or on error (bundle data is best-effort).
   */
  getBundleData(name: string): Promise<BundleData | null>;

  /**
   * Returns the transitive dependency tree for a package. Pass `version`
   * when fetching a specific tree node (lazy-load of truncated branches);
   * omit it for the top-level package tree fetch.
   * Resolves to null when unavailable or on error.
   */
  getDependencyTree(
    name: string,
    version?: string,
  ): Promise<DependencyTree | null>;
}

/** Shape of the three dep lists extracted from a package.json file. */
export interface PackageJsonDependencies {
  dependencies: string[];
  devDependencies: string[];
  peerDependencies: string[];
}
