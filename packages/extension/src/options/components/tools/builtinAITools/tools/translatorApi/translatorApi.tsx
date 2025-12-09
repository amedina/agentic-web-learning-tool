import { useCallback } from 'react';
import { Languages } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';
import z from 'zod';

export const TranslatorApiSchema = z.object({
	title: z.string(),
	description: z.string(),
	sourceLanguage: z.enum(['en', 'ja', 'es']),
	targetLanguage: z.enum(['en', 'ja', 'es']),
});

export type TranslatorApiConfig = z.infer<typeof TranslatorApiSchema>;

const createConfig: () => TranslatorApiConfig = () => {
	return {
		title: 'Translator API',
		description: 'You are a helpful translator',
		sourceLanguage: 'en',
		targetLanguage: 'es',
	};
};

const TranslatorApi = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addTranslatorApiNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'translatorApi',
			position: { x: 0, y: 0 },
			data: {
				label: 'Translator API',
			},
		});

		addApiNode({
			id,
			type: 'translatorApi',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Translator API"
			onClick={addTranslatorApiNode}
			Icon={Languages}
		/>
	);
};

export default TranslatorApi;
