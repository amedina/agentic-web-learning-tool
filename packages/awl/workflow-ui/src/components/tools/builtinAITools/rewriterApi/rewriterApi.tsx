/**
 * External dependencies
 */
import { useCallback } from "react";
import { RefreshCcw } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../ui";
import { useApi } from "../../../../stateProviders";

const RewriterApi = () => {
  const { isAvailable } = useApi(({ state }) => ({
    isAvailable: state.capabilities.rewriterApi,
  }));

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!isAvailable) return;
      event.dataTransfer.setData("workflow-composer/flow", "rewriterApi");
      event.dataTransfer.effectAllowed = "move";
    },
    [isAvailable],
  );

  return (
    <ToolItem
      label="Rewriter API"
      onDragStart={handleDragStart}
      Icon={RefreshCcw}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? "Built-in Rewriter API is not available in this browser"
          : undefined
      }
    />
  );
};

export default RewriterApi;
