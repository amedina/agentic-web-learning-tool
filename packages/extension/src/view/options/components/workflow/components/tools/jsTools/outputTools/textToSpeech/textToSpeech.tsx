/**
 * External dependencies
 */
import { useCallback } from 'react';
import { Speech } from 'lucide-react';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../../ui';
import z from 'zod';

export const TextToSpeechSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
});

export type TextToSpeechConfig = z.infer<typeof TextToSpeechSchema>;

const TextToSpeech = () => {
	const handleDragStart = useCallback((event: React.DragEvent) => {
		event.dataTransfer.setData('workflow-composer/flow', 'textToSpeech');
		event.dataTransfer.effectAllowed = 'move';
	}, []);

	return (
		<ToolItem
			label="Text to Speech"
			onDragStart={handleDragStart}
			Icon={Speech}
		/>
	);
};

export default TextToSpeech;
