/**
 * External dependencies
 */
import { useCallback } from "react";
import { Calculator } from "lucide-react";
import { z } from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

export const MathSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  operation: z.enum([
    "add",
    "subtract",
    "multiply",
    "divide",
    "power",
    "root",
    "round",
    "floor",
    "ceil",
    "abs",
  ]),
  operand: z.string().optional(), // Second operand for binary operations
});

export type MathConfig = z.infer<typeof MathSchema>;

const MathTool = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "math");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem label="Math" onDragStart={handleDragStart} Icon={Calculator} />
  );
};

export default MathTool;
