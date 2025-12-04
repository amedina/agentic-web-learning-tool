import { useMemo } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { FileSearch } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolNodeContainer } from '../../../../ui';

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
		if (!nodeId) return {};

		const node = getNode(nodeId);
		return {
			title: node?.config.title,
			type: node?.type,
			context: node?.config.context,
		};
	}, [getNode, nodeId]);

	return (
		<ToolNodeContainer
			title={config.title}
			Icon={FileSearch}
			type={config.type || ''}
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
				<div className="w-full bg-linear-to-br from-blue-50 to-indigo-50 rounded-md px-3 py-1 my-6 border border-blue-100">
					<p className="truncate text-sm text-slate-700 leading-relaxed">
						{config.context}
					</p>
				</div>

				{/* Input */}
				<Handle
					type="target"
					position={Position.Left}
					id="inputA"
					style={{
						background: 'none',
						border: 'none',
						top: '7%',
						left: '-10px',
					}}
				>
					<div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[15%] top-[2.5px]">
						<div className="min-w-3 h-3 bg-blue-600 rounded-full shadow-sm"></div>
						<span className="text-xs text-slate-600 font-medium">
							A
						</span>
					</div>
				</Handle>

				<Handle
					type="target"
					position={Position.Left}
					id="inputB"
					style={{
						background: 'none',
						border: 'none',
						top: '95%',
						left: '-10px',
					}}
				>
					<div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[15%] top-[2.5px]">
						<div className="min-w-3 h-3 bg-blue-600 rounded-full shadow-sm"></div>
						<span className="text-xs text-slate-600 font-medium">
							B
						</span>
					</div>
				</Handle>

				{/* Output */}
				<Handle
					type="source"
					position={Position.Right}
					id="outputTrue"
					style={{
						background: 'none',
						border: 'none',
						top: '7%',
						right: '-9px',
					}}
				>
					<div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[78%] top-[2.5px]">
						<span className="text-xs text-slate-600 font-medium">
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
						background: 'none',
						border: 'none',
						top: '95%',
						right: '-9px',
					}}
				>
					<div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[80%] top-[2.5px]">
						<span className="text-xs text-slate-600 font-medium">
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
