/**
 * External dependencies
 */
import { useCallback } from 'react';
import { NotepadTextDashed } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../../ui';
import { useApi, useFlow } from '../../../../../store';

export const SummarizerApiSchema = z.object({
	title: z.string(),
	context: z.string(),
	type: z.enum(['key-points', 'tldr', 'teaser', 'headline']),
	format: z.enum(['markdown', 'plain-text']),
	length: z.enum(['short', 'medium', 'long']),
	expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
	outputLanguage: z.enum(['en', 'ja', 'es']),
});

export type SummarizerApiConfig = z.infer<typeof SummarizerApiSchema>;

const createConfig: () => SummarizerApiConfig = () => {
	return {
		title: 'Summarizer',
		context:
			'Summarizes text into key points, TL;DR, teasers, or headlines.',
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

	const { addApiNode, isAvailable } = useApi(({ state, actions }) => ({
		addApiNode: actions.addNode,
		isAvailable: state.capabilities.summarizerApi,
	}));

	const addSummarizerApiNode = useCallback(() => {
		if (!isAvailable) return;

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
	}, [addApiNode, addFlowNode, isAvailable]);

	return (
		<ToolItem
			label="Summarizer API"
			onClick={addSummarizerApiNode}
			Icon={NotepadTextDashed}
			disabled={!isAvailable}
			title={
				!isAvailable
					? 'Built-in Summarizer API is not available in this browser'
					: undefined
			}
		/>
	);
};

export default SummarizerApi;
