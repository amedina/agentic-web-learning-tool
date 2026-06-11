/**
 * External dependencies
 */
import { useCallback } from "react";
import { Languages } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../ui";
import { useApi } from "../../../../stateProviders";

const TranslatorApi = () => {
  const { isAvailable } = useApi(({ state }) => ({
    isAvailable: state.capabilities.translatorApi,
  }));

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!isAvailable) return;
      event.dataTransfer.setData("workflow-composer/flow", "translatorApi");
      event.dataTransfer.effectAllowed = "move";
    },
    [isAvailable],
  );

  return (
    <ToolItem
      label="Translator API"
      onDragStart={handleDragStart}
      Icon={Languages}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? "Built-in Translator API is not available in this browser"
          : undefined
      }
    />
  );
};

export default TranslatorApi;
