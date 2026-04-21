/**
 * External dependencies
 */
import { useMemo } from "react";
import { Handle, Position, useNodeId } from "@xyflow/react";
import { FileSearch } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolNodeContainer } from "../../../../ui";
import { useApi, useFlow } from "../../../../../stateProviders";
import type { ConditionConfig } from "@google-awlt/engine-core";

const ToolNode = () => {
  const nodeId = useNodeId();
  const { getNode, selectedNode, setSelectedNode } = useApi(
    ({ state, actions }) => ({
      selectedNode: state.selectedNode,
      getNode: actions.getNode,
      setSelectedNode: actions.setSelectedNode,
    }),
  );

  const { nodes, deleteNode } = useFlow(({ state, actions }) => ({
    nodes: state.nodes,
    deleteNode: actions.deleteNode,
  }));

  const nodeStatus = useMemo(() => {
    return nodes.find((n) => n.id === nodeId)?.status;
  }, [nodes, nodeId]);

  const config = useMemo(() => {
    if (!nodeId) return undefined;

    const node = getNode(nodeId);

    if (!node) return undefined;

    const _config = node.config as ConditionConfig;

    return {
      title: _config.title,
      type: node?.type,
      description: _config.description,
    };
  }, [getNode, nodeId]);

  return (
    <ToolNodeContainer
      title={config?.title || ""}
      Icon={FileSearch}
      type={config?.type || ""}
      selected={selectedNode === nodeId}
      status={nodeStatus}
      onEdit={() => {
        setSelectedNode(nodeId);
      }}
      onRemove={() => {
        if (nodeId) {
          deleteNode(nodeId);
        }
      }}
    >
      <div className="h-fit w-full flex flex-col relative px-2">
        <div className="w-full bg-slate-50 dark:bg-zinc-800 rounded-md px-3 py-2 my-2 border border-slate-100 dark:border-border">
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
            Logic Branch
          </p>
          <p className="truncate text-xs text-slate-600 dark:text-zinc-400 italic font-medium">
            {config?.description || "Check input data"}
          </p>
        </div>

        {/* Input */}
        <Handle
          type="target"
          position={Position.Left}
          id="inputA"
          style={{
            background: "none",
            border: "none",
            top: "50%",
            left: "-10px",
          }}
        >
          <div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[30%] top-[2.5px]">
            <div className="min-w-3 h-3 bg-blue-600 rounded-full shadow-sm"></div>
          </div>
        </Handle>

        {/* Output */}
        <Handle
          type="source"
          position={Position.Right}
          id="outputTrue"
          style={{
            background: "none",
            border: "none",
            top: "7%",
            right: "-9px",
          }}
        >
          <div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[78%] top-[2.5px]">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold tracking-tight">
              TRUE
            </span>
            <div className="min-w-3 h-3 bg-green-600 rounded-full shadow-sm"></div>
          </div>
        </Handle>

        <Handle
          type="source"
          position={Position.Right}
          id="outputFalse"
          style={{
            background: "none",
            border: "none",
            top: "95%",
            right: "-9px",
          }}
        >
          <div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[80%] top-[2.5px]">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold tracking-tight">
              FALSE
            </span>
            <div className="min-w-3 h-3 bg-red-600 rounded-full shadow-sm"></div>
          </div>
        </Handle>
      </div>
    </ToolNodeContainer>
  );
};

export default ToolNode;
