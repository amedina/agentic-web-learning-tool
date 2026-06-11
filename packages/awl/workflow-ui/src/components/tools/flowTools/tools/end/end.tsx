/**
 * External dependencies
 */
import { useCallback } from "react";
import { Flag } from "lucide-react";

/**
 * Internal dependencies
 */
import { useFlow } from "../../../../../stateProviders";
import { ToolItem } from "../../../../ui";

const End = () => {
  const { nodes } = useFlow(({ state }) => ({
    nodes: state.nodes,
  }));

  const endNodeExists = nodes.some((node) => node.type === "end");

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (endNodeExists) return;
      event.dataTransfer.setData("workflow-composer/flow", "end");
      event.dataTransfer.effectAllowed = "move";
    },
    [endNodeExists],
  );

  return (
    <ToolItem
      label="Workflow End"
      onDragStart={handleDragStart}
      Icon={Flag}
      disabled={endNodeExists}
      title={
        endNodeExists
          ? "End node already exists in the workflow"
          : "Workflow exit point"
      }
    />
  );
};

export default End;
