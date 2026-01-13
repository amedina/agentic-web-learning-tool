/**
 * External dependencies
 */
import { useCallback } from "react";
import { BellRing } from "lucide-react";
import z from "zod";

/**
 * Internal dependencies
 */
import { ToolItem } from "../../../../ui";

export const AlertNotificationSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  useCustomMessage: z.boolean().optional(),
  message: z.string().optional(),
});

export type AlertNotificationConfig = z.infer<typeof AlertNotificationSchema>;

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
