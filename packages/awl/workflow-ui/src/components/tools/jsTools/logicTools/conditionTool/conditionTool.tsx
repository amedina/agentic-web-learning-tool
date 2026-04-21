/**
 * External dependencies
 */
import { useCallback } from "react";
import { Split } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

const Condition = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "condition");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem label="Condition" onDragStart={handleDragStart} Icon={Split} />
  );
};

export default Condition;
