/**
 * External dependencies.
 */
import React, { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../../lib";
import { type PackageJsonDependencies } from "../../hooks/usePackageStats";
import {
  type DependencyStatsByName,
  type DependencyStatsState,
} from "../../hooks/useDependencyStats";
import { StatCircle } from "./statCircle";

interface DashboardProps {
  statsByName: DependencyStatsByName;
  packageJsonDependencies: PackageJsonDependencies;
  summary: {
    total: number;
    loaded: number;
    notFound: number;
    errored: number;
    pendingOrLoading: number;
    isComplete: boolean;
  };
}

const hasRecommendations = (stats: PackageStats): boolean => {
  const recommendations = stats.recommendations;
  if (!recommendations) return false;
  return (
    (recommendations.nativeReplacements?.length ?? 0) > 0 ||
    (recommendations.preferredReplacements?.length ?? 0) > 0 ||
    (recommendations.microUtilityReplacements?.length ?? 0) > 0
  );
};

const hasVulnerabilities = (stats: PackageStats): boolean => {
  const count = stats.securityAdvisories?.issues?.length ?? 0;
  return count > 0;
};

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const loadedEntries = (
  names: string[],
  statsByName: DependencyStatsByName,
): PackageStats[] => {
  const result: PackageStats[] = [];
  for (const name of names) {
    const entry: DependencyStatsState | undefined = statsByName[name];
    if (entry?.status === "loaded") {
      result.push(entry.stats);
    }
  }
  return result;
};

export const Dashboard: React.FC<DashboardProps> = ({
  statsByName,
  packageJsonDependencies,
  summary,
}) => {
  const dependencyBreakdown = useMemo(() => {
    const depsLoaded = loadedEntries(
      packageJsonDependencies.dependencies,
      statsByName,
    );
    const allLoaded = [
      ...depsLoaded,
      ...loadedEntries(packageJsonDependencies.devDependencies, statsByName),
      ...loadedEntries(packageJsonDependencies.peerDependencies, statsByName),
    ];

    const vulnerableCount = allLoaded.filter(hasVulnerabilities).length;
    const licenseIssueCount = allLoaded.filter(
      (stats) => stats.licenseCompatibility?.isCompatible === false,
    ).length;
    const replaceableCount = allLoaded.filter(hasRecommendations).length;
    const totalGzip = depsLoaded.reduce(
      (sum, stats) => sum + (stats.bundle?.gzip ?? 0),
      0,
    );

    return {
      analysed: allLoaded.length,
      vulnerableCount,
      licenseIssueCount,
      replaceableCount,
      totalGzip,
    };
  }, [statsByName, packageJsonDependencies]);

  const totalDeclared =
    packageJsonDependencies.dependencies.length +
    packageJsonDependencies.devDependencies.length +
    packageJsonDependencies.peerDependencies.length;

  const analysedRatio =
    summary.total === 0 ? 0 : summary.loaded / summary.total;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Dependency Report
        </h2>
        {!summary.isComplete && summary.total > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Analysed {summary.loaded} / {summary.total}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCircle
          value={totalDeclared}
          label="Total Dependencies"
          ratio={1}
          accentClassName="text-blue-500"
        />
        <StatCircle
          value={dependencyBreakdown.vulnerableCount}
          label="With Vulnerabilities"
          ratio={
            dependencyBreakdown.analysed === 0
              ? 0
              : dependencyBreakdown.vulnerableCount /
                dependencyBreakdown.analysed
          }
          accentClassName={
            dependencyBreakdown.vulnerableCount > 0
              ? "text-red-500"
              : "text-emerald-500"
          }
        />
        <StatCircle
          value={dependencyBreakdown.licenseIssueCount}
          label="License Issues"
          ratio={
            dependencyBreakdown.analysed === 0
              ? 0
              : dependencyBreakdown.licenseIssueCount /
                dependencyBreakdown.analysed
          }
          accentClassName={
            dependencyBreakdown.licenseIssueCount > 0
              ? "text-amber-500"
              : "text-emerald-500"
          }
        />
        <StatCircle
          value={dependencyBreakdown.replaceableCount}
          label="Replaceable"
          ratio={
            dependencyBreakdown.analysed === 0
              ? 0
              : dependencyBreakdown.replaceableCount /
                dependencyBreakdown.analysed
          }
          accentClassName="text-indigo-500"
        />
        <StatCircle
          value={formatBytes(dependencyBreakdown.totalGzip)}
          label="Prod Bundle (gzip)"
          ratio={analysedRatio}
          accentClassName="text-sky-500"
        />
        <StatCircle
          value={summary.notFound + summary.errored}
          label="Could Not Analyse"
          ratio={
            summary.total === 0
              ? 0
              : (summary.notFound + summary.errored) / summary.total
          }
          accentClassName={
            summary.notFound + summary.errored > 0
              ? "text-slate-400"
              : "text-emerald-500"
          }
        />
      </div>

      <div className="grid grid-cols-3 mt-4 text-center text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {packageJsonDependencies.dependencies.length} prod
          <br />
          dependencies
        </span>
        <span>
          {packageJsonDependencies.devDependencies.length} dev
          <br />
          dependencies
        </span>
        <span>
          {packageJsonDependencies.peerDependencies.length} peer
          <br />
          dependencies
        </span>
      </div>
    </div>
  );
};
