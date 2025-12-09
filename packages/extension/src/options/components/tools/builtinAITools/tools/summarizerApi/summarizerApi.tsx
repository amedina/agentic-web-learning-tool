import { useCallback } from 'react';
import { NotepadTextDashed } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';
import z from 'zod';

export const SummarizerApiSchema = z.object({
	title: z.string(),
	context: z.string(),
	type: z.enum(['key-points', 'tldr', 'teaser', 'headline']),
	format: z.enum(['markdown', 'plain-text']),
	length: z.enum(['short', 'medium', 'long']),
	expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
	outputLanguage: z.enum(['en', 'ja', 'es']),
});

const createConfig: () => z.infer<typeof SummarizerApiSchema> = () => {
	return {
		title: 'Summarizer API',
		context: 'You are a helpful summarizer',
		type: 'key-points',
		format: 'markdown',
		length: 'short',
		expectedInputLanguages: ['en', 'ja', 'es'],
		outputLanguage: 'es',
	};
};

const SummarizerApi = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addSummarizerApiNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'summarizerApi',
			position: { x: 0, y: 0 },
			data: {
				label: 'Summarizer API',
			},
		});

		addApiNode({
			id,
			type: 'summarizerApi',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Summarizer API"
			onClick={addSummarizerApiNode}
			Icon={NotepadTextDashed}
		/>
	);
};

export default SummarizerApi;
