/**
 * External dependencies
 */
import { useCallback } from 'react';
import { Repeat } from 'lucide-react';
import z from 'zod';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../../ui';

export const LoopSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export type LoopConfig = z.infer<typeof LoopSchema>;

const Loop = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData('workflow-composer/flow', 'loop');
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return <ToolItem label="Loop" onDragStart={handleDragStart} Icon={Repeat} />;
};

export default Loop;
