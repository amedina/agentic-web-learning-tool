/**
 * External dependencies
 */
import { useCallback } from "react";
import { PenTool } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../ui";
import { useApi } from "../../../../stateProviders";

const WriterApi = () => {
  const { isAvailable } = useApi(({ state }) => ({
    isAvailable: state.capabilities.writerApi,
  }));

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!isAvailable) return;
      event.dataTransfer.setData("workflow-composer/flow", "writerApi");
      event.dataTransfer.effectAllowed = "move";
    },
    [isAvailable],
  );

  return (
    <ToolItem
      label="Writer API"
      onDragStart={handleDragStart}
      Icon={PenTool}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? "Built-in Writer API is not available in this browser"
          : undefined
      }
    />
  );
};

export default WriterApi;
