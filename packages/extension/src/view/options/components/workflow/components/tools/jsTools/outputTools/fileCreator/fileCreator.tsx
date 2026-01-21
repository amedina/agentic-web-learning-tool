/**
 * External dependencies
 */
import { useCallback } from 'react';
import { FileDown } from 'lucide-react';

/**
 * Internal dependencies
 */
import { ToolItem } from '../../../../ui';

const FileCreator = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData('workflow-composer/flow', 'fileCreator');
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <ToolItem
      label="File Creator"
      onDragStart={handleDragStart}
      Icon={FileDown}
    />
  );
};

export default FileCreator;
