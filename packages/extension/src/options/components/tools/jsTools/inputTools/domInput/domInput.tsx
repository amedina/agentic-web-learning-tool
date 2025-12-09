import { useCallback } from 'react';
import { FileSearch } from 'lucide-react';
import z from 'zod';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

export const DomInputSchema = z.object({
	title: z.string(),
	description: z.string(),
	cssSelector: z.string(),
	extract: z.enum(['textContent', 'innerText', 'innerHTML']),
	defaultValue: z.string(),
});

const createConfig: () => z.infer<typeof DomInputSchema> = () => {
	return {
		title: 'DOM Input',
		description: 'Extract text content from the DOM element.',
		cssSelector: 'body',
		extract: 'textContent',
		defaultValue: 'Test',
	};
};

const DomInput = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addDomInputNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'domInput',
			position: { x: 0, y: 0 },
			data: {
				label: 'Dom Input',
			},
		});

		addApiNode({
			id,
			type: 'domInput',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Dom Input"
			onClick={addDomInputNode}
			Icon={FileSearch}
		/>
	);
};

export default DomInput;
