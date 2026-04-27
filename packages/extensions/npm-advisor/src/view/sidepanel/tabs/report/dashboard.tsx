/**
 * External dependencies.
 */
import React, { useMemo } from "react";
import {
  CirclePieChart,
  Matrix,
  type MatrixComponentProps,
} from "@google-awlt/design-system";

/**
 * Internal dependencies.
 */
import { type PackageStats } from "../../../../lib";
import { type PackageJsonDependencies } from "../../hooks/usePackageStats";
import {
  type DependencyStatsByName,
  type DependencyStatsState,
} from "../../hooks/useDependencyStats";
import { REPORT_COLORS, dominantDependencyColor } from "./reportColors";

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
  const breakdown = useMemo(() => {
    const prodLoaded = loadedEntries(
      packageJsonDependencies.dependencies,
      statsByName,
    );
    const allLoaded = [
      ...prodLoaded,
      ...loadedEntries(packageJsonDependencies.devDependencies, statsByName),
      ...loadedEntries(packageJsonDependencies.peerDependencies, statsByName),
    ];

    const vulnerableCount = allLoaded.filter(hasVulnerabilities).length;
    const licenseIssueCount = allLoaded.filter(
      (stats) => stats.licenseCompatibility?.isCompatible === false,
    ).length;
    const replaceableCount = allLoaded.filter(hasRecommendations).length;
    const totalGzip = prodLoaded.reduce(
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

  const prodCount = packageJsonDependencies.dependencies.length;
  const devCount = packageJsonDependencies.devDependencies.length;
  const peerCount = packageJsonDependencies.peerDependencies.length;
  const totalDeclared = prodCount + devCount + peerCount;
  const unanalysedCount = summary.notFound + summary.errored;

  // The Total Dependencies swatch picks the colour of whichever dependency
  // category is the largest (prod / dev / peer). Production wins ties so a
  // typical "all three present" project still reads as blue.
  const totalDependenciesColor = dominantDependencyColor({
    prod: prodCount,
    dev: devCount,
    peer: peerCount,
  });

  const matrixComponents: MatrixComponentProps[] = [
    {
      color: totalDependenciesColor,
      title: "Total Dependencies",
      count: totalDeclared,
      countClassName: "font-semibold",
      description: `Packages declared across <strong>dependencies</strong> (${prodCount}), <strong>devDependencies</strong> (${devCount}), and <strong>peerDependencies</strong> (${peerCount}).`,
    },
    {
      color: REPORT_COLORS.vulnerable,
      title: "With Vulnerabilities",
      count: breakdown.vulnerableCount,
      countClassName: "font-semibold",
      description: `Analysed packages with at least one published GitHub security advisory (${breakdown.vulnerableCount} of ${breakdown.analysed}).`,
    },
    {
      color: REPORT_COLORS.licenseIssue,
      title: "License Issues",
      count: breakdown.licenseIssueCount,
      countClassName: "font-semibold",
      description: `Packages whose declared license is not compatible with your target project license (${breakdown.licenseIssueCount} of ${breakdown.analysed}).`,
    },
    {
      color: REPORT_COLORS.replaceable,
      title: "Replaceable",
      count: breakdown.replaceableCount,
      countClassName: "font-semibold",
      description: `Packages with a native JavaScript, micro-utility, or preferred alternative available via the e18e recommendations (${breakdown.replaceableCount} of ${breakdown.analysed}).`,
    },
  ];

  if (unanalysedCount > 0) {
    matrixComponents.push({
      color: "#94a3b8",
      title: "Could Not Analyse",
      count: unanalysedCount,
      countClassName: "font-semibold",
      description: `Packages skipped because they are not published on npmjs.com or failed to load.`,
    });
  }

  return (
    <div className="space-y-4 mb-15">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          {!summary.isComplete && summary.total > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Analysed {summary.loaded} / {summary.total}
            </span>
          )}
        </div>

        <div className="flex flex-nowrap items-start justify-center gap-3 max-w-[420px] mx-auto">
          <CirclePieChart
            centerCount={totalDeclared}
            title="Total Dependencies"
            tooltipText={`${prodCount} prod · ${devCount} dev · ${peerCount} peer`}
            data={[
              { count: prodCount, color: REPORT_COLORS.prod },
              { count: devCount, color: REPORT_COLORS.dev },
              { count: peerCount, color: REPORT_COLORS.peer },
            ]}
          />
          <CirclePieChart
            centerCount={breakdown.vulnerableCount}
            title="With Vulnerabilities"
            tooltipText={`${breakdown.vulnerableCount} of ${breakdown.analysed} analysed`}
            data={[
              {
                count: breakdown.vulnerableCount,
                color: REPORT_COLORS.vulnerable,
              },
              {
                count: Math.max(
                  0,
                  breakdown.analysed - breakdown.vulnerableCount,
                ),
                color: REPORT_COLORS.neutral,
              },
            ]}
          />
          <CirclePieChart
            centerCount={breakdown.licenseIssueCount}
            title="License Issues"
            tooltipText={`${breakdown.licenseIssueCount} of ${breakdown.analysed} analysed`}
            data={[
              {
                count: breakdown.licenseIssueCount,
                color: REPORT_COLORS.licenseIssue,
              },
              {
                count: Math.max(
                  0,
                  breakdown.analysed - breakdown.licenseIssueCount,
                ),
                color: REPORT_COLORS.neutral,
              },
            ]}
          />
          <CirclePieChart
            centerCount={breakdown.replaceableCount}
            title="Replaceable"
            tooltipText={`${breakdown.replaceableCount} of ${breakdown.analysed} analysed`}
            data={[
              {
                count: breakdown.replaceableCount,
                color: REPORT_COLORS.replaceable,
              },
              {
                count: Math.max(
                  0,
                  breakdown.analysed - breakdown.replaceableCount,
                ),
                color: REPORT_COLORS.neutral,
              },
            ]}
          />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          What do these mean?
        </h3>
        <Matrix dataComponents={matrixComponents} expand />
      </div>
    </div>
  );
};
