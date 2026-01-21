/**
 * External dependencies
 */
import { useCallback } from 'react';
import { MessageSquare } from 'lucide-react';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../../ui';

const Tooltip = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData('workflow-composer/flow', 'tooltip');
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <ToolItem
      label="Tooltip"
      onDragStart={handleDragStart}
      Icon={MessageSquare}
    />
  );
};

export default Tooltip;
