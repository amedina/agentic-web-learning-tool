import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '../../store';
import { PromptAPINodeConfig } from '../tools/builtinAITools/toolNodes';

const tools = {
	promptApi: PromptAPINodeConfig,
};

const ToolsConfig = () => {
	const { selectedNode, getNode, updateNode } = useApi(
		({ state, actions }) => ({
			selectedNode: state.selectedNode,
			getNode: actions.getNode,
			updateNode: actions.updateNode,
		})
	);

	const [node, setNode] = useState<ReturnType<typeof getNode>>();
	const [title, setTitle] = useState<string>(node?.config.title || '');
	const [context, setContext] = useState<string>(node?.config.context || '');

	const toolNodeRef = useRef<{
		getConfig: (formData: FormData) => void;
	}>(null);

	useEffect(() => {
		if (selectedNode) {
			const _node = getNode(selectedNode);
			setNode(_node);
		} else {
			setNode(undefined);
		}
	}, [selectedNode, getNode]);

	useEffect(() => {
		setTitle(node?.config.title || '');
		setContext(node?.config.context || '');
	}, [node]);

	const handleSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			const formData = new FormData(e.currentTarget);
			e.preventDefault();

			if (!node || !selectedNode) return;

			const title = formData.get('title') as string;
			const context = formData.get('context') as string;

			updateNode(selectedNode, {
				...node,
				config: {
					...node.config,
					title,
					context,
					...(toolNodeRef.current
						? toolNodeRef.current.getConfig(formData)
						: {}),
				},
			});
		},
		[node, selectedNode, updateNode]
	);

	const Tool = node?.type && tools[node?.type] ? tools[node?.type] : null;

	return (
		<div className="h-full min-w-1/7 overflow-auto">
			<h2 className="text-xl font-bold mb-4">{title}</h2>
			<form onSubmit={handleSubmit}>
				<label className="block mb-2" htmlFor="title">
					<span className="text-gray-700">Node Title:</span>
				</label>
				<input
					type="text"
					className="w-full p-2 border border-gray-300 rounded"
					placeholder="Enter node title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					name="title"
				/>
				<label className="block mb-2 mt-4" htmlFor="context">
					<span className="text-gray-700">Node Context:</span>
				</label>
				<textarea
					className="w-full p-2 border border-gray-300 rounded"
					placeholder="Enter node Context"
					value={context}
					onChange={(e) => setContext(e.target.value)}
					name="context"
				></textarea>
				<div>{Tool && <Tool ref={toolNodeRef} node={node} />}</div>
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
