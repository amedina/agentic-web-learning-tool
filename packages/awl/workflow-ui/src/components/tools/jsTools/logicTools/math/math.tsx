/**
 * External dependencies
 */
import { useCallback } from "react";
import { Calculator } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

const MathTool = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "math");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem label="Math" onDragStart={handleDragStart} Icon={Calculator} />
  );
};

export default MathTool;
