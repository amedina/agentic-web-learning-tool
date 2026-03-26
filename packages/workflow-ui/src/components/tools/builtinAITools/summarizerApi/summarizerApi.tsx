/**
 * External dependencies
 */
import { useCallback } from "react";
import { NotepadTextDashed } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../ui";
import { useApi } from "../../../../stateProviders";

const SummarizerApi = () => {
  const { isAvailable } = useApi(({ state }) => ({
    isAvailable: state.capabilities.summarizerApi,
  }));

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!isAvailable) return;
      event.dataTransfer.setData("workflow-composer/flow", "summarizerApi");
      event.dataTransfer.effectAllowed = "move";
    },
    [isAvailable],
  );

  return (
    <ToolItem
      label="Summarizer API"
      onDragStart={handleDragStart}
      Icon={NotepadTextDashed}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? "Built-in Summarizer API is not available in this browser"
          : undefined
      }
    />
  );
};

export default SummarizerApi;
