/**
 * External dependencies.
 */
import {
  getPackageStats,
  type PackageStats,
  type DependencyCategory,
  DEFAULT_TARGET_PROJECT_LICENSE,
} from "@google-awlt/package-analyzer-core";
import * as vscode from "vscode";

function getTargetLicense(): string {
  const config = vscode.workspace.getConfiguration("npmAdvisor");
  const configured = config.get<string>("targetLicense");
  return configured && configured.trim()
    ? configured.trim()
    : DEFAULT_TARGET_PROJECT_LICENSE;
}

class PackageStatsService {
  private readonly lightCache = new Map<
    string,
    Promise<PackageStats | null> | PackageStats | null
  >();

  private cacheKey(name: string, category: DependencyCategory): string {
    return `${name}::${category}`;
  }

  async getLightStats(
    packageName: string,
    category: DependencyCategory = "unknown",
  ): Promise<PackageStats | null> {
    const key = this.cacheKey(packageName, category);
    const cached = this.lightCache.get(key);
    if (cached !== undefined) {
      return cached instanceof Promise ? cached : cached;
    }

    const promise = (async () => {
      try {
        const stats = await getPackageStats(packageName, getTargetLicense(), {
          includeDependencyTree: false,
          includeBundle: false,
          includeGithubIssues: false,
          dependencyCategory: category,
        });
        if (!stats?.githubRateLimited) {
          this.lightCache.set(key, stats);
        } else {
          this.lightCache.delete(key);
        }
        return stats;
      } catch (error) {
        this.lightCache.delete(key);
        throw error;
      }
    })();

    this.lightCache.set(key, promise);
    return promise;
  }

  clearCache(): void {
    this.lightCache.clear();
  }
}

export const packageStatsService = new PackageStatsService();
