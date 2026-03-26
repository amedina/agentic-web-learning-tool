/**
 * External dependencies
 */
import { useCallback } from "react";
import { Play } from "lucide-react";

/**
 * Internal dependencies
 */
import { useFlow } from "../../../../../stateProviders";
import { ToolItem } from "../../../../ui";

const Start = () => {
  const { nodes } = useFlow(({ state }) => ({
    nodes: state.nodes,
  }));

  const startNodeExists = nodes.some((node) => node.type === "start");

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (startNodeExists) return;
      event.dataTransfer.setData("workflow-composer/flow", "start");
      event.dataTransfer.effectAllowed = "move";
    },
    [startNodeExists],
  );

  return (
    <ToolItem
      label="Workflow Start"
      onDragStart={handleDragStart}
      Icon={Play}
      disabled={startNodeExists}
      title={
        startNodeExists
          ? "Start node already exists in the workflow"
          : "Workflow entry point"
      }
    />
  );
};

export default Start;
