import { useMemo } from 'react';
import { useNodeId } from '@xyflow/react';
import { useApi } from '../../../../../store';

const PromptAPINode = () => {
	const nodeId = useNodeId();
	const { getNode, removeNode } = useApi(({ actions }) => ({
		getNode: actions.getNode,
		removeNode: actions.removeNode
	}));

	const config = useMemo(() => {
		if (!nodeId) return {};

		const node = getNode(nodeId);
		return {
			title: node?.config.title,
			type: node?.type,
			context: node?.config.context,
		};
	}, []);

	return (
		<div className="p-2 border rounded">
			Prompt API Tool Node - {config.title} ({config.type}){' '}
			{config.context}
			<button
				onClick={() => {
					if (nodeId) removeNode(nodeId);
				}}
			>
				X
			</button>
		</div>
	);
};

export default PromptAPINode;
