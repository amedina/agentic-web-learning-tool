/**
 * External dependencies
 */
import { useCallback } from "react";
import { FileDown } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

export const FileCreatorSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  filename: z.string(),
});

export type FileCreatorConfig = z.infer<typeof FileCreatorSchema>;

const FileCreator = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "fileCreator");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem
      label="File Creator"
      onDragStart={handleDragStart}
      Icon={FileDown}
    />
  );
};

export default FileCreator;
