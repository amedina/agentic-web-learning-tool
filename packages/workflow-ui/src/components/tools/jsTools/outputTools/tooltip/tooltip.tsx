/**
 * External dependencies
 */
import { useCallback } from "react";
import { MessageSquare } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

export const TooltipSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  selector: z.string(),
});

export type TooltipConfig = z.infer<typeof TooltipSchema>;

const Tooltip = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "tooltip");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem
      label="Tooltip"
      onDragStart={handleDragStart}
      Icon={MessageSquare}
    />
  );
};

export default Tooltip;
