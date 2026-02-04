/**
 * External dependencies
 */
import { useCallback } from "react";
import { BellRing } from "lucide-react";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

const AlertNotification = () => {
  const handleDragStart = useCallback((event: React.DragEvent) => {
    event.dataTransfer.setData("workflow-composer/flow", "alertNotification");
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <ToolItem
      label="Alert Notification"
      onDragStart={handleDragStart}
      Icon={BellRing}
    />
  );
};

export default AlertNotification;
