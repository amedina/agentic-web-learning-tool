/**
 * External dependencies.
 */
import React, { useState } from "react";
import { Network, LayoutList, Share2, Loader2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { DependencyTree as DependencyTreeType } from "@agentic-web-labs/package-analyzer-core";
import DependencyGraph from "./dependencyGraph";
import { DepTreeNode } from "./depTreeNode";

export interface DependencyTreeProps {
  dependencyTree: DependencyTreeType | null;
  /**
   * When true, renders the widget shell with a centered loader. Used by
   * the Dependencies tab where the transitive dep tree is fetched lazily on
   * accordion expand to avoid hammering npm with recursive fetches up front.
   */
  isLoading?: boolean;
}

export const DependencyTree: React.FC<DependencyTreeProps> = ({
  dependencyTree,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<"tree" | "graph">("graph");

  if (!dependencyTree && isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200 mb-3">
          <Network
            size={16}
            className="mr-2 text-slate-600 dark:text-slate-400"
          />
          Dependencies
        </h2>
        <div
          className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500 dark:text-slate-400"
          role="status"
          aria-live="polite"
        >
          <Loader2 size={14} className="animate-spin" />
          <span>Resolving transitive dependency tree…</span>
        </div>
      </div>
    );
  }

  if (!dependencyTree) return null;

  const hasDependencies =
    Object.keys(dependencyTree.dependencies ?? {}).length > 0;
  const isRootTruncated = dependencyTree._truncated === true;

  if (!hasDependencies && !isRootTruncated) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200 mb-3">
          <Network
            size={16}
            className="mr-2 text-slate-600 dark:text-slate-400"
          />
          Dependencies
        </h2>
        <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 italic">
          This package has no dependencies.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200">
          <Network
            size={16}
            className="mr-2 text-slate-600 dark:text-slate-400"
          />{" "}
          Dependencies
        </h2>

        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("graph")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              viewMode === "graph"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Share2 size={12} />
            Graph
          </button>
          <button
            onClick={() => setViewMode("tree")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              viewMode === "tree"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <LayoutList size={12} />
            List
          </button>
        </div>
      </div>

      <div className="overflow-auto transition-all duration-300">
        {viewMode === "tree" ? (
          <DepTreeNode node={dependencyTree} depth={0} />
        ) : (
          <DependencyGraph data={dependencyTree} />
        )}
      </div>
    </div>
  );
};
