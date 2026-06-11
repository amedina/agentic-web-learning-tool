/**
 * External dependencies
 */
import { useCallback } from "react";
import { ClipboardCopy } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

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
