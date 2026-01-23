/**
 * External dependencies
 */
import { useMemo } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { Repeat } from 'lucide-react';

/**
 * Internal dependencies
 */
import { ToolNodeContainer } from '../../../../ui';
import { useApi, useFlow } from '../../../../../stateProviders';
import type { LoopConfig } from './loopTool';

const ToolNode = () => {
  const nodeId = useNodeId();
  const { getNode, selectedNode, setSelectedNode } = useApi(
    ({ state, actions }) => ({
      selectedNode: state.selectedNode,
      getNode: actions.getNode,
      setSelectedNode: actions.setSelectedNode,
    })
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

    const _config = node.config as LoopConfig;

    return {
      title: _config.title,
      type: node?.type,
      description: _config.description,
    };
  }, [getNode, nodeId]);

  return (
    <ToolNodeContainer
      title={config?.title || ''}
      Icon={Repeat}
      type={config?.type || ''}
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
        <div className="w-full bg-linear-to-br from-indigo-50/50 to-purple-50/50 dark:from-zinc-800/80 dark:to-zinc-900/80 rounded-md px-3 py-2 my-2 border border-indigo-100/50 dark:border-border">
          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
            Iterator
          </p>
          <p className="truncate text-xs text-slate-600 dark:text-zinc-300 italic font-medium">
            {config?.description || 'Loop through input data'}
          </p>
        </div>

        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{
            background: 'none',
            border: 'none',
            top: '50%',
            left: '-10px',
          }}
        >
          <div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[30%] top-[2.5px]">
            <div className="min-w-3 h-3 bg-blue-600 rounded-full shadow-sm"></div>
          </div>
        </Handle>

        {/* ITEM Handle - Fires once per item */}
        <Handle
          type="source"
          position={Position.Right}
          id="item"
          style={{
            background: 'none',
            border: 'none',
            top: '15%',
            right: '-9px',
          }}
        >
          <div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[78%] top-[2.5px]">
            <span className="text-[10px] text-slate-600 dark:text-zinc-500 font-bold tracking-tight">
              ITEM
            </span>
            <div className="min-w-3 h-3 bg-indigo-600 rounded-full shadow-sm"></div>
          </div>
        </Handle>

        {/* DONE Handle - Fires when loop is complete */}
        <Handle
          type="source"
          position={Position.Right}
          id="done"
          style={{
            background: 'none',
            border: 'none',
            top: '85%',
            right: '-9px',
          }}
        >
          <div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[78%] top-[2.5px]">
            <span className="text-[10px] text-slate-600 dark:text-zinc-500 font-bold tracking-tight">
              DONE
            </span>
            <div className="min-w-3 h-3 bg-green-600 rounded-full shadow-sm"></div>
          </div>
        </Handle>
      </div>
    </ToolNodeContainer>
  );
};

export default ToolNode;
