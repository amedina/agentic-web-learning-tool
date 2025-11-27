import { useCallback } from 'react';
import { NotebookTextIcon } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import ToolItem from '../../../ui/toolItem';

const createConfig = () => {
	return {
		title: 'Prompt API',
		context: 'You are a helpful assistant',
		topK: 3,
		temperature: 1,
		expectedInputs: [
			{
				type: 'text',
				languages: ['en', 'ja'],
			},
		],
		expectedOutputs: [{ type: 'text', languages: ['ja'] }],
		initialPrompts:
			"[{role: 'system', content: 'You are a helpful assistant.',},]",
	};
};

const PromptAPI = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addPromptAPINode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'promptApi',
			position: { x: 0, y: 0 },
			data: {
				label: 'Prompt API',
			},
		});

		addApiNode({
			id,
			type: 'promptApi',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Prompt API"
			onClick={addPromptAPINode}
			Icon={NotebookTextIcon}
		/>
	);
};

export default PromptAPI;
