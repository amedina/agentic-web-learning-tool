/**
 * External dependencies
 */
import { useCallback } from "react";
import { Pencil } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

export const DomReplacementSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  selector: z.string(),
});

export type DomReplacementConfig = z.infer<typeof DomReplacementSchema>;

const DomReplacement = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "domReplacement");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem
      label="DOM Replacement"
      onDragStart={handleDragStart}
      Icon={Pencil}
    />
  );
};

export default DomReplacement;
