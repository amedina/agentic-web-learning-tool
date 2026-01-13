/**
 * External dependencies
 */
import { useCallback } from "react";
import { RefreshCcw } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";
import { useApi } from "../../../../../stateProviders";

export const RewriterApiSchema = z.object({
  title: z.string(),
  context: z.string(),
  tone: z.enum(["more-formal", "as-is", "more-casual"]),
  format: z.enum(["as-is", "markdown", "plain-text"]),
  length: z.enum(["shorter", "as-is", "longer"]),
  expectedInputLanguages: z.array(z.enum(["en", "ja", "es"])),
  outputLanguage: z.enum(["en", "ja", "es"]),
});

export type RewriterApiConfig = z.infer<typeof RewriterApiSchema>;

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
