/**
 * External dependencies.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@google-awlt/design-system";
import {
  ChevronDown,
  Loader2,
  ShieldAlert,
  Scale,
  Sparkles,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import { type DependencyStatsState } from "../../hooks/useDependencyStats";
import { type PackageStats, type DependencyTree } from "../../../../lib";
import { PackageInsightsBody } from "../insights/packageInsightsBody";
import { REPORT_COLORS } from "./reportColors";

type BundleData = NonNullable<PackageStats["bundle"]>;

/**
 * Module-scoped caches so reopening the same row doesn't re-fetch, and the
 * same package opened from different categories shares the result.
 */
const bundleCache = new Map<string, BundleData | null>();
const dependencyTreeCache = new Map<string, DependencyTree | null>();

interface DependencyAccordionRowProps {
  packageName: string;
  state: DependencyStatsState;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

const StatusSummary: React.FC<{ state: DependencyStatsState }> = ({
  state,
}) => {
  if (state.status === "pending" || state.status === "loading") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 size={12} className="animate-spin" />
        Loading
      </span>
    );
  }

  if (state.status === "not_found") {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Not on npmjs.com
      </span>
    );
  }

  if (state.status === "error") {
    return (
      <span className="text-xs text-red-600 dark:text-red-400">Error</span>
    );
  }

  const stats = state.stats;
  const vulnerabilityCount = stats.securityAdvisories?.issues?.length ?? 0;
  const hasLicenseIssue = stats.licenseCompatibility?.isCompatible === false;
  const recommendations = stats.recommendations;
  const isReplaceable =
    (recommendations?.nativeReplacements?.length ?? 0) > 0 ||
    (recommendations?.preferredReplacements?.length ?? 0) > 0 ||
    (recommendations?.microUtilityReplacements?.length ?? 0) > 0;

  // The Fitness score is intentionally not shown on Report rows. Fitness
  // is a composite that includes Responsiveness, which we don't load for
  // dep rows because the Search API quota that powers it routinely
  // throttles during a multi-dep scan. Showing a partial-coverage score
  // here would be misleading.
  return (
    <div className="flex items-center gap-1.5">
      {vulnerabilityCount > 0 && (
        <Badge
          color={REPORT_COLORS.vulnerable}
          icon={<ShieldAlert size={10} />}
          title={`${vulnerabilityCount} vulnerabilit${vulnerabilityCount === 1 ? "y" : "ies"}`}
        >
          {vulnerabilityCount}
        </Badge>
      )}
      {hasLicenseIssue && (
        <Badge
          color={REPORT_COLORS.licenseIssue}
          icon={<Scale size={10} />}
          title="License incompatible with target"
        />
      )}
      {isReplaceable && (
        <Badge
          color={REPORT_COLORS.replaceable}
          icon={<Sparkles size={10} />}
          title="Modern replacement available"
        />
      )}
    </div>
  );
};

interface BadgeProps {
  color: string;
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}

/**
 * Compact pill that signals one of the report's key parameters
 * (vulnerabilities / license issues / replaceable) on an accordion trigger.
 * Uses the canonical color from `REPORT_COLORS` so the same parameter looks
 * the same in the dashboard pie/matrix and in the accordion row badge.
 */
const Badge: React.FC<BadgeProps> = ({ color, icon, title, children }) => (
  <span
    title={title}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
    style={{
      backgroundColor: `${color}20`,
      color,
    }}
  >
    {icon}
    {children}
  </span>
);

export const DependencyAccordionRow: React.FC<DependencyAccordionRowProps> = ({
  packageName,
  state,
  onAddRecommendationToCompare,
  comparisonBucketNames,
  addingRecommendations,
}) => {
  const [open, setOpen] = useState(false);
  const [bundleData, setBundleData] = useState<BundleData | null>(() =>
    bundleCache.has(packageName) ? bundleCache.get(packageName)! : null,
  );
  const [bundleLoading, setBundleLoading] = useState(false);
  const [depTreeData, setDepTreeData] = useState<DependencyTree | null>(() =>
    dependencyTreeCache.has(packageName)
      ? dependencyTreeCache.get(packageName)!
      : null,
  );
  const [depTreeLoading, setDepTreeLoading] = useState(false);

  const stats = state.status === "loaded" ? state.stats : null;

  // Lazy-load bundlephobia data the first time the user expands the row.
  // The light-stats fetch deliberately skips this to keep the initial scan
  // cheap when most rows are never opened.
  useEffect(() => {
    if (!open || !stats || stats.bundle || bundleData || bundleLoading) {
      return;
    }
    if (bundleCache.has(packageName)) {
      setBundleData(bundleCache.get(packageName)!);
      return;
    }

    setBundleLoading(true);
    chrome.runtime.sendMessage(
      { type: "GET_BUNDLE_DATA", packageName },
      (response) => {
        setBundleLoading(false);
        if (chrome.runtime.lastError || !response?.success) {
          bundleCache.set(packageName, null);
          return;
        }
        const fetched = response.data;
        if (!fetched) {
          bundleCache.set(packageName, null);
          return;
        }
        const normalised: BundleData = {
          size: fetched.size,
          gzip: fetched.gzip,
          isTreeShakeable: fetched.hasJSModule,
          hasSideEffects: fetched.hasSideEffects,
        };
        bundleCache.set(packageName, normalised);
        setBundleData(normalised);
      },
    );
  }, [open, packageName, stats, bundleData, bundleLoading]);

  // Lazy-load the transitive dependency tree on first expand. Light stats
  // skip this because resolving the tree fans out into recursive npm
  // fetches that we don't want to pay for unless the row is actually
  // opened.
  useEffect(() => {
    if (
      !open ||
      !stats ||
      stats.dependencyTree ||
      depTreeData ||
      depTreeLoading
    ) {
      return;
    }
    if (dependencyTreeCache.has(packageName)) {
      setDepTreeData(dependencyTreeCache.get(packageName)!);
      return;
    }

    setDepTreeLoading(true);
    chrome.runtime.sendMessage(
      { type: "GET_DEP_TREE", packageName },
      (response) => {
        setDepTreeLoading(false);
        if (chrome.runtime.lastError || !response?.success) {
          dependencyTreeCache.set(packageName, null);
          return;
        }
        const tree = (response.data as DependencyTree | null) ?? null;
        dependencyTreeCache.set(packageName, tree);
        setDepTreeData(tree);
      },
    );
  }, [open, packageName, stats, depTreeData, depTreeLoading]);

  // Merge any lazily-fetched bundle and dep tree into the rendered stats.
  // The score breakdown isn't recomputed — the dashboard's aggregate
  // scoring stays consistent with what was shown at scan time, and the
  // user can always see the actual data inside the widgets.
  const renderedStats = useMemo(() => {
    if (!stats) return stats;
    const needsBundle = !stats.bundle && bundleData;
    const needsTree = !stats.dependencyTree && depTreeData;
    if (!needsBundle && !needsTree) return stats;
    return {
      ...stats,
      bundle: needsBundle ? bundleData : stats.bundle,
      dependencyTree: needsTree ? depTreeData : stats.dependencyTree,
    };
  }, [stats, bundleData, depTreeData]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-b border-slate-200 dark:border-slate-700 last:border-b-0"
    >
      <CollapsibleTrigger className="group w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors outline-none">
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown
            size={14}
            className="shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180"
          />
          <span
            className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate"
            title={packageName}
          >
            {packageName}
          </span>
        </div>
        <StatusSummary state={state} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 pt-1">
        {state.status === "loaded" && renderedStats ? (
          <PackageInsightsBody
            stats={renderedStats}
            onAddRecommendationToCompare={onAddRecommendationToCompare}
            comparisonBucketNames={comparisonBucketNames}
            addingRecommendations={addingRecommendations}
            showHeader
            showDependencyTree
            bundleLoading={bundleLoading}
            dependencyTreeLoading={depTreeLoading}
            hideResponsiveness
            hideFitness
          />
        ) : state.status === "not_found" ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            This package was not found on npmjs.com. It may not be published.
          </p>
        ) : state.status === "error" ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-2">
            <Loader2 size={12} className="animate-spin" />
            Fetching stats…
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
