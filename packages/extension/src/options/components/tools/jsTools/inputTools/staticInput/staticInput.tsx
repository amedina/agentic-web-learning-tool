import { useCallback } from 'react';
import { FormInput } from 'lucide-react';
import z from 'zod';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

export const StaticInputSchema = z.object({
	title: z.string(),
	description: z.string(),
	inputValue: z.string(),
});

export type StaticInputConfig = z.infer<typeof StaticInputSchema>;

const createConfig: () => StaticInputConfig = () => {
	return {
		title: 'Static Input',
		description: 'Provide a static text input.',
		inputValue: '',
	};
};

const StaticInput = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addStaticInputNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'staticInput',
			position: { x: 0, y: 0 },
			data: {
				label: 'Static Input',
			},
		});

		addApiNode({
			id,
			type: 'staticInput',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Static Input"
			onClick={addStaticInputNode}
			Icon={FormInput}
		/>
	);
};

export default StaticInput;
