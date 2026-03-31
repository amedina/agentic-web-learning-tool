/**
 * External dependencies.
 */
import React from "react";
import { Info, Plus, Check, Loader2 } from "lucide-react";

export interface RecommendationsProps {
  recommendations: {
    nativeReplacements?: any;
    microUtilityReplacements?: any[];
    preferredReplacements?: any[];
  };
  onAddToCompare?: (packageName: string) => void;
  comparisonBucketNames?: Set<string>;
  addingRecommendations?: Set<string>;
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
}

const AddToCompareButton: React.FC<AddToCompareButtonProps> = ({
  packageName,
  onAddToCompare,
  isAdded,
  isAdding,
}) => {
  if (isAdded) {
    return (
      <button
        onClick={() => {
          chrome.tabs.create({
            url: chrome.runtime.getURL("options/options.html#comparison"),
          });
        }}
        className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors shrink-0"
        title="Added — click to view comparison"
      >
        <Check size={10} />
      </button>
    );
  }

  if (isAdding) {
    return (
      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 shrink-0">
        <Loader2 size={12} className="animate-spin text-slate-400" />
      </span>
    );
  }

  return (
    <button
      onClick={() => onAddToCompare(packageName)}
      className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shrink-0"
      title={`Add ${packageName} to comparison`}
    >
      <Plus size={10} />
    </button>
  );
};

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
  onAddToCompare,
  comparisonBucketNames = new Set(),
  addingRecommendations = new Set(),
}) => {
  if (!Object.values(recommendations || {}).some((rec) => !!rec)) return null;

  const renderItem = (r: any, idx: number, showExample = true) => {
    const linkUrl = getRecommendationUrl(r);
    const npmPackageName = getNpmPackageName(r);
    const label = r.description || r.replacementModule || r.id;

    return (
      <div key={idx} className="mb-3 last:mb-0">
        <div className="flex items-center">
          {linkUrl ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] leading-snug text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
              title={`View ${label}`}
            >
              {label}
            </a>
          ) : (
            <p className="text-[13px] leading-snug">{label}</p>
          )}
          {npmPackageName && onAddToCompare && (
            <AddToCompareButton
              packageName={npmPackageName}
              onAddToCompare={onAddToCompare}
              isAdded={comparisonBucketNames.has(npmPackageName)}
              isAdding={addingRecommendations.has(npmPackageName)}
            />
          )}
        </div>
        {showExample && r.example && (
          <code className="block bg-slate-100 dark:bg-slate-600 px-2 py-1.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200 mt-1.5 border border-slate-200/60 dark:border-slate-500 overflow-x-auto">
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
