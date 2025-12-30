/**
 * External dependencies
 */
import { useCallback } from 'react';
import { FormInput } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../../ui';

export const StaticInputSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	inputValue: z.string(),
	isMultiple: z.boolean().optional(),
});

export type StaticInputConfig = z.infer<typeof StaticInputSchema>;

const StaticInput = () => {
	const handleDragStart = useCallback((event: React.DragEvent) => {
		event.dataTransfer.setData('workflow-composer/flow', 'staticInput');
		event.dataTransfer.effectAllowed = 'move';
	}, []);

	return (
		<ToolItem
			label="Static Input"
			onDragStart={handleDragStart}
			Icon={FormInput}
		/>
	);
};

export default StaticInput;
