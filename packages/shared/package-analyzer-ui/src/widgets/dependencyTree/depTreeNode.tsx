/**
 * External dependencies.
 */
import { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { DependencyTree as DependencyTreeType } from "@agentic-web-labs/package-analyzer-core";
import { useStatsClient } from "../../context/statsClientContext";

export type DepNode = DependencyTreeType & { _loaded?: boolean };

/**
 * Renders a single node in the dependency tree. When a node was truncated by
 * the API, expanding it lazily fetches the remaining children so the tree is
 * only resolved on demand.
 */
export const DepTreeNode = ({
  node,
  depth = 0,
}: {
  node: DepNode;
  depth?: number;
}) => {
  const statsClient = useStatsClient();
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

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const loaded = await statsClient.getDependencyTree(node.name, versionStr);
      setIsLoaded(true);
      if (loaded) {
        setChildren((loaded.dependencies ?? {}) as Record<string, DepNode>);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [node.name, versionStr, statsClient]);

  useEffect(() => {
    if (expanded && isTruncated && !loadingMore && !isLoaded) {
      void loadMore();
    }
  }, [expanded, isTruncated, loadingMore, isLoaded, loadMore]);

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
