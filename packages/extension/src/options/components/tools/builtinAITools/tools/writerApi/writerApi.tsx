import { useCallback } from 'react';
import { PenTool } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';
import z from 'zod';

const WriterApiSchema = z.object({
	title: z.string(),
	context: z.string(),
	tone: z.enum(['formal', 'neutral', 'casual']),
	format: z.enum(['markdown', 'plain-text']),
	length: z.enum(['short', 'medium', 'long']),
	expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
	outputLanguage: z.enum(['en', 'ja', 'es']),
});

const createConfig: () => z.infer<typeof WriterApiSchema> = () => {
	return {
		title: 'Writer API',
		context: 'You are a helpful writer',
		tone: 'neutral',
		format: 'markdown',
		length: 'short',
		expectedInputLanguages: ['en', 'ja', 'es'],
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
