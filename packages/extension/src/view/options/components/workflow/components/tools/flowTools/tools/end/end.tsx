/**
 * External dependencies
 */
import { useCallback } from 'react';
import { Flag } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { useFlow } from '../../../../../stateProviders';
import { ToolItem } from '../../../../ui';

export const EndSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
});

export type EndConfig = z.infer<typeof EndSchema>;

const End = () => {
	const { nodes } = useFlow(({ state }) => ({
		nodes: state.nodes,
	}));

	const endNodeExists = nodes.some((node) => node.type === 'end');

	const handleDragStart = useCallback(
		(event: React.DragEvent) => {
			if (endNodeExists) return;
			event.dataTransfer.setData('workflow-composer/flow', 'end');
			event.dataTransfer.effectAllowed = 'move';
		},
		[endNodeExists]
	);

	return (
		<ToolItem
			label="Workflow End"
			onDragStart={handleDragStart}
			Icon={Flag}
			disabled={endNodeExists}
			title={
				endNodeExists
					? 'End node already exists in the workflow'
					: 'Workflow exit point'
			}
		/>
	);
};

export default End;
