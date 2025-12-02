import { useMemo } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { ScanSearch } from 'lucide-react';
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
			Icon={ScanSearch}
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
			<div className="h-full min-h-[120px]">
				<div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-md p-3 mb-4 border border-blue-100">
					<p className="text-sm text-slate-700 leading-relaxed">
						{config.context}
					</p>
				</div>
				<Handle
					type="target"
					position={Position.Left}
					style={{
						background: 'none',
						border: 'none',
						top: '145px',
					}}
				>
					<div className="relative">
						<div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] top-[2.5px]">
							<div className="min-w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
							<div className="flex flex-col">
								<span className="text-xs font-semibold text-slate-600">
									Input
								</span>
								<span className="text-xs text-gray-500 italic">
									(string)
								</span>
							</div>
						</div>
					</div>
				</Handle>
				<Handle
					type="source"
					position={Position.Right}
					style={{
						background: 'none',
						border: 'none',
						top: '170px',
					}}
				>
					<div className="relative">
						<div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] translate-x-[-90%] top-[2.5px]">
							<div className="flex flex-col items-end">
								<span className="text-xs font-semibold text-slate-600">
									Output
								</span>
								<span className="text-xs text-gray-500 italic">
									(string)
								</span>
							</div>
							<div className="min-w-3 h-3 bg-green-600 rounded-full shadow-sm"></div>
						</div>
					</div>
				</Handle>
			</div>
		</ToolNodeContainer>
	);
};

export default ToolNode;
