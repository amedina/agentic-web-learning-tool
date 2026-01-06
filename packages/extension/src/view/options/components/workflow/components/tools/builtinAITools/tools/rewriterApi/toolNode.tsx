/**
 * External dependencies
 */
import { useMemo } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { RefreshCcw } from 'lucide-react';

/**
 * Internal dependencies
 */
import { ToolNodeContainer } from '../../../../ui';
import { useApi, useFlow } from '../../../../../stateProviders';
import type { RewriterApiConfig } from './rewriterApi';

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

		const _config = node.config as RewriterApiConfig;

		return {
			type: node?.type,
			title: _config.title,
			context: _config.context,
		};
	}, [getNode, nodeId]);

	return (
		<ToolNodeContainer
			title={config?.title || ''}
			Icon={RefreshCcw}
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
				<div className="w-full bg-linear-to-br from-indigo-50/50 to-blue-50/50 dark:from-zinc-800/80 dark:to-zinc-900/80 rounded-md px-3 py-2 my-2 border border-indigo-100/50 dark:border-border">
					<p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
						Rewriter API
					</p>
					<p className="truncate text-xs text-slate-600 dark:text-zinc-400 italic font-medium">
						{config?.context || 'Enter context...'}
					</p>
				</div>
				<Handle
					type="target"
					position={Position.Left}
					style={{
						background: 'none',
						border: 'none',
						top: '50%x',
						left: '-10px',
					}}
				>
					<div className="flex items-center gap-2 w-fit absolute -translate-x-[30%] translate-y-[-50%] top-[2.5px]">
						<div className="min-w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
					</div>
				</Handle>
				<Handle
					type="source"
					position={Position.Right}
					style={{
						background: 'none',
						border: 'none',
						top: '50%',
						right: '-10px',
					}}
				>
					<div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[10%] top-[2.5px]">
						<div className="min-w-3 h-3 bg-green-600 rounded-full shadow-sm"></div>
					</div>
				</Handle>
			</div>
		</ToolNodeContainer>
	);
};

export default ToolNode;
