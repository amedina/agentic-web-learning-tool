import { useCallback } from 'react';
import { BookCheck } from 'lucide-react';
import z from 'zod';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

export const ProofreaderApiSchema = z.object({
	title: z.string(),
	description: z.string(),
	expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
});

export type ProofreaderApiConfig = z.infer<typeof ProofreaderApiSchema>;

const createConfig: () => ProofreaderApiConfig = () => {
	return {
		title: 'Proofreader API',
		description: 'You are a helpful proofreader',
		expectedInputLanguages: ['en', 'ja', 'es'],
	};
};

const ProofreaderApi = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addProofreaderApiNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'proofreaderApi',
			position: { x: 0, y: 0 },
			data: {
				label: 'Proofreader API',
			},
		});

		addApiNode({
			id,
			type: 'proofreaderApi',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Proofreader API"
			onClick={addProofreaderApiNode}
			Icon={BookCheck}
		/>
	);
};

export default ProofreaderApi;
