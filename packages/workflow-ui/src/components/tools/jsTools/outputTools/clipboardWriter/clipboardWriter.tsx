/**
 * External dependencies
 */
import { useCallback } from "react";
import { ClipboardCopy } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";
import z from "zod";

export const ClipboardWriterSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export type ClipboardWriterConfig = z.infer<typeof ClipboardWriterSchema>;

const ClipboardWriter = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "clipboardWriter");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem
      label="Clipboard Writer"
      onDragStart={handleDragStart}
      Icon={ClipboardCopy}
    />
  );
};

export default ClipboardWriter;
