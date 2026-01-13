/**
 * External dependencies
 */
import { useCallback } from "react";
import { PenTool } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";
import { useApi } from "../../../../../stateProviders";

export const WriterApiSchema = z.object({
  title: z.string(),
  context: z.string(),
  tone: z.enum(["formal", "neutral", "casual"]),
  format: z.enum(["markdown", "plain-text"]),
  length: z.enum(["short", "medium", "long"]),
  expectedInputLanguages: z.array(z.enum(["en", "ja", "es"])),
  outputLanguage: z.enum(["en", "ja", "es"]),
});

export type WriterApiConfig = z.infer<typeof WriterApiSchema>;

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
