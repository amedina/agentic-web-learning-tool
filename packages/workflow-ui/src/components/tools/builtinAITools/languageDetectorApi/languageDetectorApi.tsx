/**
 * External dependencies
 */
import { useCallback } from "react";
import { ScanSearch } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../ui";
import { useApi } from "../../../../stateProviders";

export const LanguageDetectorApiSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export type LanguageDetectorApiConfig = z.infer<
  typeof LanguageDetectorApiSchema
>;

const LanguageDetectorApi = () => {
  const { isAvailable } = useApi(({ state }) => ({
    isAvailable: state.capabilities.languageDetectorApi,
  }));

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!isAvailable) return;
      event.dataTransfer.setData(
        "workflow-composer/flow",
        "languageDetectorApi",
      );
      event.dataTransfer.effectAllowed = "move";
    },
    [isAvailable],
  );

  return (
    <ToolItem
      label="Language Detector"
      onDragStart={handleDragStart}
      Icon={ScanSearch}
      disabled={!isAvailable}
      title={
        !isAvailable
          ? "Built-in Language Detector API is not available in this browser"
          : undefined
      }
    />
  );
};

export default LanguageDetectorApi;
