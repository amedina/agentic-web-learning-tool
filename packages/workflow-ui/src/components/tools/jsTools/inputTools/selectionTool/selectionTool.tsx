/**
 * External dependencies
 */
import { useCallback } from "react";
import { MousePointer2 } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

const SelectionTool = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "selectionTool");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem
      label="Selection Tool"
      onDragStart={handleDragStart}
      Icon={MousePointer2}
    />
  );
};

export default SelectionTool;
