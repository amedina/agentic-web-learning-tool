/**
 * External dependencies
 */
import { useCallback } from 'react';
import { Split } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../../ui';

export const ConditionSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	comparisonType: z.enum([
		'equals',
		'not-equals',
		'greater-than',
		'less-than',
	]),
});

export type ConditionConfig = z.infer<typeof ConditionSchema>;

const Condition = () => {
	const handleDragStart = useCallback((event: React.DragEvent) => {
		event.dataTransfer.setData('workflow-composer/flow', 'condition');
		event.dataTransfer.effectAllowed = 'move';
	}, []);

	return (
		<ToolItem
			label="Condition"
			onDragStart={handleDragStart}
			Icon={Split}
		/>
	);
};

export default Condition;
