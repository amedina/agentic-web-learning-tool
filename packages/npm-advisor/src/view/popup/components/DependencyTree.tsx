import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { DependencyTree as DependencyTreeType } from "../../../utils/api";

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

  const childEntries = Object.entries(children);
  const hasChildren = childEntries.length > 0;
  const isTruncated = node._truncated && !node._loaded;
  const versionStr = node.resolvedVersion || node.requestedVersion || "latest";

  const loadMore = () => {
    setLoadingMore(true);
    chrome.runtime.sendMessage(
      { type: "FETCH_DEP_TREE", packageName: node.name, version: versionStr },
      (response) => {
        setLoadingMore(false);
        if (response?.success && response.data) {
          const loaded = response.data as DepNode;
          loaded._loaded = true;
          setChildren(loaded.dependencies ?? {});
        }
      },
    );
  };

  return (
    <div
      style={{ paddingLeft: depth > 0 ? "12px" : "0" }}
      className={depth > 0 ? "border-l border-slate-100" : ""}
    >
      <div
        className="flex items-center gap-1 py-0.5 px-1 cursor-pointer hover:bg-slate-50 rounded text-[11px] transition-colors"
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
          {isTruncated && (
            <div
              style={{ paddingLeft: "16px" }}
              className="border-l border-slate-100 mt-0.5"
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  loadMore();
                }}
                disabled={loadingMore}
                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline py-0.5 px-1 cursor-pointer disabled:opacity-50 transition-colors bg-blue-50/50 rounded"
              >
                {loadingMore ? "Loading..." : "+ Load dependencies"}
              </button>
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
      <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-3 pb-2 border-b border-slate-100">
        Dependencies
      </h2>
      <div className="max-h-[300px] overflow-auto">
        <DepTreeNode node={dependencyTree} depth={0} />
      </div>
    </div>
  );
};
