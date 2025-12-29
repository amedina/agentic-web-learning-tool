/**
 * External dependencies
 */
import { useCallback } from 'react';
import { FileSearch } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../../ui';

export const DomInputSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	cssSelector: z.string(),
	extract: z.enum(['textContent', 'innerText', 'innerHTML']),
	defaultValue: z.string(),
});

export type DomInputConfig = z.infer<typeof DomInputSchema>;

const DomInput = () => {
	const handleDragStart = useCallback((event: React.DragEvent) => {
		event.dataTransfer.setData('workflow-composer/flow', 'domInput');
		event.dataTransfer.effectAllowed = 'move';
	}, []);

	return (
		<ToolItem
			label="Dom Input"
			onDragStart={handleDragStart}
			Icon={FileSearch}
		/>
	);
};

export default DomInput;
