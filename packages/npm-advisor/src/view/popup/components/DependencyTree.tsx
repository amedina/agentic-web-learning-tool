/**
 * External dependencies.
 */
import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Network } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { DependencyTree as DependencyTreeType } from "../../../utils";

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

  const loadMore = () => {
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
  };

  useEffect(() => {
    if (expanded && isTruncated && !loadingMore && !isLoaded) {
      loadMore();
    }
  }, [expanded, isTruncated, loadingMore, isLoaded]);

  return (
    <div
      style={{ paddingLeft: depth > 0 ? "16px" : "0" }}
      className={depth > 0 ? "border-l border-slate-100" : ""}
    >
      <div
        className="flex items-center gap-1.5 py-1 px-1 cursor-pointer hover:bg-slate-50 rounded text-[13px] transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        {hasChildren || isTruncated ? (
          expanded ? (
            <ChevronDown size={12} className="shrink-0 text-slate-400" />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-slate-400" />
          )
        ) : (
          <span className="w-[12px] shrink-0" />
        )}
        <span className="font-mono text-slate-700 font-medium">
          {node.name}
        </span>
        <span className="text-slate-400 ml-1 font-mono">{versionStr}</span>
        {node.error && (
          <span className="text-red-400 text-[10px] ml-1 px-1 bg-red-50 rounded-sm">
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
              className="text-[11px] text-slate-400 font-medium py-1 italic"
            >
              Loading remaining dependencies...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface DependencyTreeProps {
  dependencyTree: DependencyTreeType | null;
}

export const DependencyTree: React.FC<DependencyTreeProps> = ({
  dependencyTree,
}) => {
  if (!dependencyTree) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-2 pb-1 border-b border-slate-100">
        <Network size={16} className="mr-2 text-slate-600" /> Dependencies
      </h2>
      <div className="max-h-[300px] overflow-auto">
        <DepTreeNode node={dependencyTree} depth={0} />
      </div>
    </div>
  );
};
