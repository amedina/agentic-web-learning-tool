import { useMemo } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { useApi } from '../../../../../store';
import ToolNodeContainer from '../../../toolNodeContainer';

const PromptAPINode = () => {
	const nodeId = useNodeId();
	const { getNode, setSelectedNode } = useApi(({ actions }) => ({
		getNode: actions.getNode,
		setSelectedNode: actions.setSelectedNode,
	}));

	const config = useMemo(() => {
		if (!nodeId) return {};

		const node = getNode(nodeId);
		console.log('PromptAPINode config:', node);
		return {
			title: node?.config.title,
			type: node?.type,
			context: node?.config.context,
		};
	}, [getNode, nodeId]);

	return (
		<ToolNodeContainer
			title={config.title}
			type={config.type || ''}
			onEdit={() => {
				console.log('Selecting node:', nodeId);
				setSelectedNode(nodeId);
			}}
		>
			<div className="flex flex-col gap-4 h-40">
				<p className="text-base">{config.context}</p>
				<Handle
					type="target"
					position={Position.Left}
					style={{
						background: 'none',
						border: 'none',
						top: '160px',
					}}
				>
					<div className="absolute -top-1/2 -left-1/2 w-3 h-3 bg-blue-500 rounded-full" />
					<p className="absolute left-4 -top-3 flex items-center gap-1">
						<span className="text-base">Input</span>
						<span className="text-xs text-gray-400 italic">
							(string)
						</span>
					</p>
				</Handle>

				<Handle
					type="source"
					position={Position.Right}
					style={{
						background: 'none',
						border: 'none',
						top: '200px',
					}}
				>
					<div className="absolute -top-1/2 -left-1/2 w-3 h-3 bg-green-600 rounded-full" />
					<p className="absolute -left-26 -top-3 flex items-center gap-1">
						<span className="text-base">Output</span>
						<span className="text-xs text-gray-400 italic">
							(string)
						</span>
					</p>
				</Handle>
			</div>
		</ToolNodeContainer>
	);
};

export default PromptAPINode;
