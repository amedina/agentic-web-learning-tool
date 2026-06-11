/**
 * External dependencies
 */
import { useCallback } from "react";
import { NotebookTextIcon } from "lucide-react";

/**
 * Internal dependencies
 */
import { useApi } from "../../../../stateProviders";
import { ToolItem } from "../../../ui";

const PromptApi = () => {
  const { isAvailable } = useApi(({ state }) => ({
    isAvailable: state.capabilities.promptApi,
  }));

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!isAvailable) return;
      event.dataTransfer.setData("workflow-composer/flow", "promptApi");
      event.dataTransfer.effectAllowed = "move";
    },
    [isAvailable],
  );

  return (
    <ToolItem
      label="Prompt API"
      onDragStart={handleDragStart}
      Icon={NotebookTextIcon}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? "Built-in Prompt API is not available in this browser"
          : undefined
      }
    />
  );
};

export default PromptApi;
