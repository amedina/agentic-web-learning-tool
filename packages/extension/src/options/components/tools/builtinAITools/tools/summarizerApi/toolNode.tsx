import { useMemo } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { NotepadTextDashed } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolNodeContainer } from '../../../../ui';
import type { SummarizerApiConfig } from './summarizerApi';

const ToolNode = () => {
	const nodeId = useNodeId();
	const { getNode, selectedNode, setSelectedNode } = useApi(
		({ state, actions }) => ({
			selectedNode: state.selectedNode,
			getNode: actions.getNode,
			setSelectedNode: actions.setSelectedNode,
		})
	);

	const { deleteNode } = useFlow(({ actions }) => ({
		deleteNode: actions.deleteNode,
	}));

	const config = useMemo(() => {
		if (!nodeId) return undefined;

		const node = getNode(nodeId);

		if (!node) return undefined;

		const _config = node.config as SummarizerApiConfig;

		return {
			title: _config.title,
			type: node?.type,
			context: _config.context,
		};
	}, [getNode, nodeId]);

	return (
		<ToolNodeContainer
			title={config?.title || ''}
			Icon={NotepadTextDashed}
			type={config?.type || ''}
			selected={selectedNode === nodeId}
			onEdit={() => {
				setSelectedNode(nodeId);
			}}
			onRemove={() => {
				if (nodeId) {
					deleteNode(nodeId);
				}
			}}
		>
			<div className="h-fit w-full flex flex-col relative">
				<div className="w-full bg-linear-to-br from-blue-50 to-indigo-50 rounded-md p-3 my-2 border border-blue-100">
					<p className="truncate text-sm text-slate-700 leading-relaxed">
						{config?.context || ''}
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
