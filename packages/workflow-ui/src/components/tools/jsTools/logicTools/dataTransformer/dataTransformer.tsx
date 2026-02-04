/**
 * External dependencies
 */
import { useCallback } from "react";
import { Database } from "lucide-react";
import { z } from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

export const DataTransformerSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  operation: z.enum([
    "regex",
    "jsonParse",
    "format",
    "split",
    "join",
    "template",
    "filter",
    "map",
    "objectKeys",
    "objectValues",
  ]),
  pattern: z.string().optional(),
  flags: z.string().optional(),
  path: z.string().optional(),
  formatType: z.enum(["lowercase", "uppercase", "trim", "length"]).optional(),
  separator: z.string().optional(),
  index: z.string().optional(),
  template: z.string().optional(),
  filterKey: z.string().optional(),
  filterValue: z.string().optional(),
  mapPath: z.string().optional(),
});

export type DataTransformerConfig = z.infer<typeof DataTransformerSchema>;

const DataTransformer = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "dataTransformer");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem
      label="Transformer"
      onDragStart={handleDragStart}
      Icon={Database}
    />
  );
};

export default DataTransformer;
