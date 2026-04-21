/**
 * External dependencies
 */
import { useCallback } from "react";
import { FileSearch } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

const DomInput = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "domInput");
    event.dataTransfer.effectAllowed = "move";
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
