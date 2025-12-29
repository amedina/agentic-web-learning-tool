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
		'not_equals',
		'contains',
		'not_contains',
		'starts_with',
		'ends_with',
		'greater_than',
		'less_than',
		'greater_equal',
		'less_equal',
	]),
	comparisonValue: z.string(),
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
