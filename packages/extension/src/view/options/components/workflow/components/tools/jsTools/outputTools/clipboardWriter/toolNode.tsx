/**
 * External dependencies
 */
import { useMemo } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { ClipboardCopy } from 'lucide-react';

/**
 * Internal dependencies
 */
import { ToolNodeContainer } from '../../../../ui';
import { useApi, useFlow } from '../../../../../stateProviders';

const ToolNode = () => {
	const nodeId = useNodeId();
	const { selectedNode, setSelectedNode } = useApi(({ state, actions }) => ({
		selectedNode: state.selectedNode,
		setSelectedNode: actions.setSelectedNode,
	}));

	const { nodes, deleteNode } = useFlow(({ state, actions }) => ({
		nodes: state.nodes,
		deleteNode: actions.deleteNode,
	}));

	const nodeStatus = useMemo(() => {
		return nodes.find((n) => n.id === nodeId)?.status;
	}, [nodes, nodeId]);

	return (
		<ToolNodeContainer
			title="Clipboard Writer"
			Icon={ClipboardCopy}
			type="clipboardWriter"
			selected={selectedNode === nodeId}
			status={nodeStatus}
			onEdit={() => setSelectedNode(nodeId)}
			onRemove={() => nodeId && deleteNode(nodeId)}
		>
			<div className="h-fit w-full flex flex-col relative py-2">
				<p className="text-xs text-slate-500 italic px-1">
					Copies input to clipboard
				</p>
				<Handle
					type="target"
					position={Position.Left}
					style={{
						background: 'none',
						border: 'none',
						top: '50%',
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
