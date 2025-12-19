/**
 * External dependencies
 */
import { useCallback } from 'react';
import { ScanSearch } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

export const LanguageDetectorApiSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
});

export type LanguageDetectorApiConfig = z.infer<
	typeof LanguageDetectorApiSchema
>;

const createConfig: () => LanguageDetectorApiConfig = () => {
	return {
		title: 'Language Detector',
		description:
			'Analyzes input text to determine the source language (e.g., English, Spanish, Japanese).',
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
				label: 'Language Detector',
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
			label="Language Detector"
			onClick={addLanguageDetectorApiNode}
			Icon={ScanSearch}
		/>
	);
};

export default LanguageDetectorApi;
