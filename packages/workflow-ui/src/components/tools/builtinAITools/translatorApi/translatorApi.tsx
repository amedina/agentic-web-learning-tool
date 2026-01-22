/**
 * External dependencies
 */
import { useCallback } from "react";
import { Languages } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../ui";
import { useApi } from "../../../../stateProviders";

export const TranslatorApiSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  sourceLanguage: z.enum(["en", "ja", "es"]),
  targetLanguage: z.enum(["en", "ja", "es"]),
});

export type TranslatorApiConfig = z.infer<typeof TranslatorApiSchema>;

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
