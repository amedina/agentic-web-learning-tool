/**
 * External dependencies
 */
import { useCallback } from "react";
import { NotebookTextIcon } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { useApi } from "../../../../../stateProviders";
import { ToolItem } from "../../../../ui";

export const PromptApiSchema = z.object({
  title: z.string(),
  context: z.string(),
  topK: z.number().min(1).max(128),
  temperature: z.number().min(0).max(2),
  expectedInputsLanguages: z.array(z.enum(["en", "es", "ja"])),
  expectedOutputsLanguages: z.array(z.enum(["en", "es", "ja"])),
  initialPrompts: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    }),
  ),
});

export type PromptApiConfig = z.infer<typeof PromptApiSchema>;

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
      label="Chat Assistant"
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
