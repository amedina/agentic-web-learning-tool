import { useCallback } from 'react';
import { Split } from 'lucide-react';
import z from 'zod';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

export const ConditionSchema = z.object({
	title: z.string(),
	description: z.string(),
	comparisonType: z.enum([
		'equals',
		'not-equals',
		'greater-than', 
		'less-than',
	]),
});

export type ConditionConfig = z.infer<typeof ConditionSchema>;

const createConfig: () => ConditionConfig = () => {
	return {
		title: 'Condition',
		description: 'If/Else condition based on compared values.',
		comparisonType: 'equals',
	};
};

const Condition = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addConditionNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'condition',
			position: { x: 0, y: 0 },
			data: {
				label: 'Condition',
			},
		});

		addApiNode({
			id,
			type: 'condition',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem label="Condition" onClick={addConditionNode} Icon={Split} />
	);
};

export default Condition;
