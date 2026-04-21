/**
 * External dependencies
 */
import { useCallback } from "react";
import { FormInput } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

const StaticInput = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "staticInput");
    event.dataTransfer.effectAllowed = "move";
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
