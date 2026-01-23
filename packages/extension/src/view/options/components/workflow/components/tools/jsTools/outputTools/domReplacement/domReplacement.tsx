/**
 * External dependencies
 */
import { useCallback } from 'react';
import { Pencil } from 'lucide-react';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../../ui';

const DomReplacement = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData('workflow-composer/flow', 'domReplacement');
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <ToolItem
      label="DOM Replacement"
      onDragStart={handleDragStart}
      Icon={Pencil}
    />
  );
};

export default DomReplacement;
