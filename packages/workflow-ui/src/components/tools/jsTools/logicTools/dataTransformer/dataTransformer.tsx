/**
 * External dependencies
 */
import { useCallback } from "react";
import { Database } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

const DataTransformer = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "dataTransformer");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem
      label="Transformer"
      onDragStart={handleDragStart}
      Icon={Database}
    />
  );
};

export default DataTransformer;
