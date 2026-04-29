/**
 * External dependencies.
 */
import React from "react";
import { Info, Plus, Check, Loader2, ExternalLink } from "lucide-react";

export interface RecommendationsProps {
  recommendations: {
    nativeReplacements?: any;
    microUtilityReplacements?: any[];
    preferredReplacements?: any[];
  };
  onAddToCompare?: (packageName: string) => void;
  comparisonBucketNames?: Set<string>;
  addingRecommendations?: Set<string>;
  /**
   * Renders a placeholder shell while stats are still loading. After the
   * fetch resolves, the widget reverts to its existing logic — including
   * returning null when no recommendations exist.
   */
  isLoading?: boolean;
  /**
   * Called when the user clicks "View Comparison" after adding a package.
   * Consumers provide this to navigate to the comparison tab/view.
   */
  onNavigateToComparison?: () => void;
}

import { getRecommendationUrl } from "./utils/getRecommendationUrl";

/** Returns the npm package name if the recommendation is an npm package, otherwise null. */
function getNpmPackageName(r: any): string | null {
  if (r.replacementModule) return r.replacementModule;
  if (r.url?.type === "npm") return r.url.id;
  return null;
}

interface AddToCompareButtonProps {
  packageName: string;
  onAddToCompare: (packageName: string) => void;
  isAdded: boolean;
  isAdding: boolean;
  onNavigateToComparison?: () => void;
}

const AddToCompareButton: React.FC<AddToCompareButtonProps> = ({
  packageName,
  onAddToCompare,
  isAdded,
  isAdding,
  onNavigateToComparison,
}) => {
  if (isAdding) {
    return (
      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 shrink-0">
        <Loader2 size={12} className="animate-spin text-slate-400" />
      </span>
    );
  }

  if (isAdded) {
    return (
      <div className="group/tooltip relative ml-2 shrink-0">
        <button
          onClick={() => onNavigateToComparison?.()}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
        >
          <Check size={10} />
        </button>
        <div className="pointer-events-none hidden group-hover/tooltip:block absolute z-50 w-28 p-1.5 bg-slate-800 text-white text-xs rounded-md bottom-full left-1/2 -translate-x-1/2 mb-2 shadow-lg text-center whitespace-normal">
          View comparison
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="group/tooltip relative ml-2 shrink-0">
      <button
        onClick={() => onAddToCompare(packageName)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
      >
        <Plus size={10} />
      </button>
      <div className="pointer-events-none hidden group-hover/tooltip:block absolute z-50 w-24 p-1.5 bg-slate-800 text-white text-xs rounded-md bottom-full left-1/2 -translate-x-1/2 mb-2 shadow-lg text-center whitespace-normal">
        Add to compare
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
  onAddToCompare,
  comparisonBucketNames = new Set(),
  addingRecommendations = new Set(),
  isLoading = false,
  onNavigateToComparison,
}) => {
  const hasAnyRec = Object.values(recommendations || {}).some((rec) => !!rec);
  if (!hasAnyRec && isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200 mb-3">
          <Info size={16} className="mr-2 text-slate-600 dark:text-slate-400" />{" "}
          Alternative Recommendations
        </h2>
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }
  if (!hasAnyRec) return null;

  const renderItem = (r: any, idx: number, showExample = true) => {
    const linkUrl = getRecommendationUrl(r);
    const npmPackageName = getNpmPackageName(r);
    const label = r.description || r.replacementModule || r.id;

    return (
      <div
        key={idx}
        className="py-2 border-b border-slate-200/80 dark:border-slate-600 last:border-b-0"
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[13px] font-mono font-medium text-slate-800 dark:text-slate-200 truncate"
            title={label}
          >
            {label}
          </span>
          <div className="flex items-center shrink-0">
            {linkUrl && (
              <a
                href={linkUrl}
                target="_blank"
                rel="noreferrer"
                title={`View ${label}`}
                className="inline-flex items-center justify-center w-5 h-5 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ExternalLink size={10} />
              </a>
            )}
            {npmPackageName && onAddToCompare && (
              <AddToCompareButton
                packageName={npmPackageName}
                onAddToCompare={onAddToCompare}
                isAdded={comparisonBucketNames.has(npmPackageName)}
                isAdding={addingRecommendations.has(npmPackageName)}
                onNavigateToComparison={onNavigateToComparison}
              />
            )}
          </div>
        </div>
        {showExample && r.example && (
          <code className="block bg-slate-100 dark:bg-slate-600 px-2 py-1.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200 mt-2 border border-slate-200/60 dark:border-slate-500 overflow-x-auto">
            {r.example}
          </code>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200 mb-3">
        <Info size={16} className="mr-2 text-slate-600 dark:text-slate-400" />{" "}
        Alternative Recommendations
      </h2>
      <div className="space-y-3">
        {recommendations.nativeReplacements && (
          <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200/80 dark:border-slate-600">
            <strong className="block mb-2 font-semibold text-slate-800 dark:text-slate-200">
              Native APIs Available:
            </strong>
            {Array.isArray(recommendations.nativeReplacements)
              ? recommendations.nativeReplacements.map((r: any, idx) =>
                  renderItem(r, idx, true),
                )
              : null}
          </div>
        )}

        {recommendations.microUtilityReplacements && (
          <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200/80 dark:border-slate-600">
            <strong className="block mb-2 font-semibold text-slate-800 dark:text-slate-200">
              Micro-utility Replacement:
            </strong>
            {Array.isArray(recommendations.microUtilityReplacements)
              ? recommendations.microUtilityReplacements.map((r: any, idx) =>
                  renderItem(r, idx, true),
                )
              : null}
          </div>
        )}

        {recommendations.preferredReplacements && (
          <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200/80 dark:border-slate-600">
            <strong className="block mb-2 font-semibold text-slate-800 dark:text-slate-200">
              Preferred Alternative Library:
            </strong>
            {Array.isArray(recommendations.preferredReplacements)
              ? recommendations.preferredReplacements.map((r: any, idx) =>
                  renderItem(r, idx, false),
                )
              : null}
          </div>
        )}
      </div>
    </div>
  );
};
