import { useCallback } from 'react';
import { PenTool } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

const createConfig = () => {
	return {
		title: 'Writer API',
		context: 'You are a helpful writer',
		tone: 'neutral',
		format: 'markdown',
		length: 'short',
		expectedInputLanguages: ['en', 'ja', 'es'],
		expectedContextLanguages: ['en', 'ja', 'es'],
		outputLanguage: 'es',
	};
};

const WriterApi = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addWriterApiNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'writerApi',
			position: { x: 0, y: 0 },
			data: {
				label: 'Writer API',
			},
		});

		addApiNode({
			id,
			type: 'writerApi',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Writer API"
			onClick={addWriterApiNode}
			Icon={PenTool}
		/>
	);
};

export default WriterApi;
