/**
 * External dependencies
 */
import { useCallback } from "react";
import { NotepadTextDashed } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";
import { useApi } from "../../../../../stateProviders";

export const SummarizerApiSchema = z.object({
  title: z.string(),
  context: z.string(),
  type: z.enum(["key-points", "tldr", "teaser", "headline"]),
  format: z.enum(["markdown", "plain-text"]),
  length: z.enum(["short", "medium", "long"]),
  expectedInputLanguages: z.array(z.enum(["en", "ja", "es"])),
  outputLanguage: z.enum(["en", "ja", "es"]),
});

export type SummarizerApiConfig = z.infer<typeof SummarizerApiSchema>;

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
