/**
 * External dependencies.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Network,
  LayoutList,
  Share2,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import type { DependencyTree as DependencyTreeType } from "../../../../utils";
import DependencyGraph from "./dependencyGraph";

type DepNode = DependencyTreeType & { _loaded?: boolean };

const DepTreeNode = ({
  node,
  depth = 0,
}: {
  node: DepNode;
  depth?: number;
}) => {
  const [expanded, setExpanded] = useState(depth === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [children, setChildren] = useState<Record<string, DepNode>>(
    node.dependencies ?? {},
  );
  const [isLoaded, setIsLoaded] = useState(!!node._loaded);

  const childEntries = Object.entries(children);
  const hasChildren = childEntries.length > 0;
  // It is truncated if the API returned `_truncated: true` and we haven't successfully loaded more yet.
  const isTruncated = node._truncated && !isLoaded;
  const versionStr = node.resolvedVersion || node.requestedVersion || "latest";

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    chrome.runtime.sendMessage(
      { type: "FETCH_DEP_TREE", packageName: node.name, version: versionStr },
      (response) => {
        setLoadingMore(false);
        setIsLoaded(true);
        if (response?.success && response.data) {
          const loaded = response.data as DepNode;
          setChildren(loaded.dependencies ?? {});
        }
      },
    );
  }, [node.name, versionStr]);

  useEffect(() => {
    if (expanded && isTruncated && !loadingMore && !isLoaded) {
      loadMore();
    }
  }, [expanded, isTruncated, loadingMore, isLoaded]);

  return (
    <div
      style={{ paddingLeft: depth > 0 ? "16px" : "0" }}
      className={
        depth > 0 ? "border-l border-slate-100 dark:border-slate-700" : ""
      }
    >
      <div
        className="flex items-center gap-1.5 py-1 px-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-[13px] transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        {hasChildren || isTruncated ? (
          expanded ? (
            <ChevronDown
              size={12}
              className="shrink-0 text-slate-400 dark:text-slate-500"
            />
          ) : (
            <ChevronRight
              size={12}
              className="shrink-0 text-slate-400 dark:text-slate-500"
            />
          )
        ) : (
          <span className="w-[12px] shrink-0" />
        )}
        <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
          {node.name}
        </span>
        <span className="text-slate-400 dark:text-slate-500 ml-1 font-mono">
          {versionStr}
        </span>
        {node.error && (
          <span className="text-red-400 text-[10px] ml-1 px-1 bg-red-50 dark:bg-red-900/20 rounded-sm">
            error
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-0.5">
          {hasChildren &&
            childEntries.map(([depName, depNode]) => (
              <DepTreeNode key={depName} node={depNode} depth={depth + 1} />
            ))}
          {loadingMore && (
            <div
              style={{ paddingLeft: "24px" }}
              className="text-[11px] text-slate-400 dark:text-slate-500 font-medium py-1 italic"
            >
              Loading remaining dependencies...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface DependencyTreeProps {
  dependencyTree: DependencyTreeType | null;
}

export const DependencyTree: React.FC<DependencyTreeProps> = ({
  dependencyTree,
}) => {
  const [viewMode, setViewMode] = useState<"tree" | "graph">("graph");

  if (!dependencyTree) return null;

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

      <div className="max-h-100 overflow-auto">
        {viewMode === "tree" ? (
          <DepTreeNode node={dependencyTree} depth={0} />
        ) : (
          <DependencyGraph data={dependencyTree} />
        )}
      </div>
    </div>
  );
};
