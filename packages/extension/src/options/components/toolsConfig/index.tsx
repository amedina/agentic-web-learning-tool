import { useApi } from '../../store';
import { useCallback, useEffect, useState } from 'react';

const ToolsConfig = () => {
	const { selectedNode, getNode, updateNode } = useApi(
		({ state, actions }) => ({
			selectedNode: state.selectedNode,
			getNode: actions.getNode,
			updateNode: actions.updateNode,
		})
	);

const [node, setNode] = useState<ReturnType<typeof getNode>>();

	useEffect(() => {
		console.log(selectedNode)
		if (selectedNode) setNode(getNode(selectedNode));
	}, [selectedNode, getNode]);

	const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
		const formData = new FormData(e.currentTarget);
		e.preventDefault();

		if (!node || !selectedNode) return;

		const title = formData.get('title') as string;
		const context = formData.get('context') as string;
		console.log('Submitting:', { title, context });

		updateNode(selectedNode, {
			...node,
			config: {
				...node.config,
				title,
				context,
			},
		});
	}, [node, selectedNode, updateNode]);

	return (
		<div className="h-full min-w-1/7">
			<h2 className="text-xl font-bold mb-4">{node?.config.title}</h2>
			<form onSubmit={handleSubmit}>
				<label className="block mb-2" htmlFor="title">
					<span className="text-gray-700">Node Title:</span>
				</label>
				<input
					type="text"
					className="w-full p-2 border border-gray-300 rounded"
					placeholder="Enter node title"
					defaultValue={node?.config.title}
					name="title"
				/>
				<label className="block mb-2 mt-4" htmlFor="context">
					<span className="text-gray-700">Node Context:</span>
				</label>
				<textarea
					className="w-full p-2 border border-gray-300 rounded"
					placeholder="Enter node Context"
					defaultValue={node?.config.context}
					name="context"
				></textarea>
				<button
					type="submit"
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
				>
					Save Configuration
				</button>
			</form>
		</div>
	);
};

export default ToolsConfig;
