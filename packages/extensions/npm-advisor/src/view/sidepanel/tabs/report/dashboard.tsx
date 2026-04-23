/**
 * External dependencies.
 */
import React, { useMemo } from "react";
import {
  CirclePieChart,
  DetailsCard,
  Details,
  type DetailsSection,
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

const COLORS = {
  prod: "#4C79F4",
  dev: "#F3AE4E",
  peer: "#5CC971",
  vulnerable: "#EC7159",
  licenseIssue: "#F3AE4E",
  replaceable: "#8b5cf6",
  neutral: "#e2e8f0",
};

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

  const detailsSections: DetailsSection[] = [
    {
      label: "Total Dependencies",
      content: `${totalDeclared} packages declared across dependencies (${prodCount}), devDependencies (${devCount}), and peerDependencies (${peerCount}).`,
    },
    {
      label: "With Vulnerabilities",
      content: `${breakdown.vulnerableCount} of ${breakdown.analysed} analysed packages have at least one published GitHub security advisory.`,
    },
    {
      label: "License Issues",
      content: `${breakdown.licenseIssueCount} of ${breakdown.analysed} analysed packages declare a license that is not compatible with your target project license.`,
    },
    {
      label: "Replaceable",
      content: `${breakdown.replaceableCount} of ${breakdown.analysed} analysed packages have a native JavaScript, micro-utility, or preferred alternative available via the e18e recommendations.`,
    },
    {
      label: "Production Bundle Footprint",
      content: `${formatBytes(breakdown.totalGzip)} gzipped across the ${prodCount} production dependencies. Only packages listed under "dependencies" ship to end users.`,
    },
  ];

  if (unanalysedCount > 0) {
    detailsSections.push({
      label: "Could Not Analyse",
      content: `${unanalysedCount} package${unanalysedCount === 1 ? " was" : "s were"} skipped because they are not published on npmjs.com or failed to load.`,
    });
  }

  return (
    <div className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
          <CirclePieChart
            centerCount={totalDeclared}
            title="Total Dependencies"
            tooltipText={`${prodCount} prod · ${devCount} dev · ${peerCount} peer`}
            data={[
              { count: prodCount, color: COLORS.prod },
              { count: devCount, color: COLORS.dev },
              { count: peerCount, color: COLORS.peer },
            ]}
          />
          <CirclePieChart
            centerCount={breakdown.vulnerableCount}
            title="With Vulnerabilities"
            tooltipText={`${breakdown.vulnerableCount} of ${breakdown.analysed} analysed`}
            data={[
              { count: breakdown.vulnerableCount, color: COLORS.vulnerable },
              {
                count: Math.max(
                  0,
                  breakdown.analysed - breakdown.vulnerableCount,
                ),
                color: COLORS.neutral,
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
                color: COLORS.licenseIssue,
              },
              {
                count: Math.max(
                  0,
                  breakdown.analysed - breakdown.licenseIssueCount,
                ),
                color: COLORS.neutral,
              },
            ]}
          />
          <CirclePieChart
            centerCount={breakdown.replaceableCount}
            title="Replaceable"
            tooltipText={`${breakdown.replaceableCount} of ${breakdown.analysed} analysed`}
            data={[
              { count: breakdown.replaceableCount, color: COLORS.replaceable },
              {
                count: Math.max(
                  0,
                  breakdown.analysed - breakdown.replaceableCount,
                ),
                color: COLORS.neutral,
              },
            ]}
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          What do these mean?
        </h3>
        {/*
         * DetailsCard relies on `h-full` internally, so it needs a parent
         * with a resolvable height. A flex container with a content-based
         * min-height lets the card grow with its sections instead of
         * collapsing behind `overflow-y-auto`.
         */}
        <div
          className="flex bg-white dark:bg-slate-800 rounded-xl"
          style={{ minHeight: 40 * detailsSections.length + 40 }}
        >
          <DetailsCard hasContent>
            <Details sections={detailsSections} />
          </DetailsCard>
        </div>
      </div>
    </div>
  );
};
