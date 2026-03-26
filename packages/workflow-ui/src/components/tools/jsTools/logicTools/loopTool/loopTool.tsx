/**
 * External dependencies
 */
import { useCallback } from "react";
import { Repeat } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

const Loop = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "loop");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return <ToolItem label="Loop" onDragStart={handleDragStart} Icon={Repeat} />;
};

export default Loop;
