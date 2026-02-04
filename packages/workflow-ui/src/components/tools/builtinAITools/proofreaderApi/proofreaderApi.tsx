import { useCallback } from "react";
import { BookCheck } from "lucide-react";

/**
 * Internal dependencies
 */
import { useApi } from "../../../../stateProviders";
import { ToolItem } from "../../../ui";

const ProofreaderApi = () => {
  const { isAvailable } = useApi(({ state }) => ({
    isAvailable: state.capabilities.proofreaderApi,
  }));

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!isAvailable) return;
      event.dataTransfer.setData("workflow-composer/flow", "proofreaderApi");
      event.dataTransfer.effectAllowed = "move";
    },
    [isAvailable],
  );

  return (
    <ToolItem
      label="Proofreader API"
      onDragStart={handleDragStart}
      Icon={BookCheck}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? "Built-in Proofreader API is not available in this browser"
          : undefined
      }
    />
  );
};

export default ProofreaderApi;
