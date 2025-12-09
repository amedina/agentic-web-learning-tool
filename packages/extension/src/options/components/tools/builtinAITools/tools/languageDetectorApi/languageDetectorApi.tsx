import { useCallback } from 'react';
import { ScanSearch } from 'lucide-react';
import z from 'zod';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

export const LanguageDetectorApiSchema = z.object({
	title: z.string(),
	description: z.string(),
});

export type LanguageDetectorApiConfig = z.infer<
	typeof LanguageDetectorApiSchema
>;

const createConfig: () => LanguageDetectorApiConfig = () => {
	return {
		title: 'Language Detector API',
		description: 'Determine the language of input text.',
	};
};

const LanguageDetectorApi = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addLanguageDetectorApiNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'languageDetectorApi',
			position: { x: 0, y: 0 },
			data: {
				label: 'Language Detector API',
			},
		});

		addApiNode({
			id,
			type: 'languageDetectorApi',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Language Detector API"
			onClick={addLanguageDetectorApiNode}
			Icon={ScanSearch}
		/>
	);
};

export default LanguageDetectorApi;
