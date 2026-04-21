/**
 * External dependencies
 */
import {
  NotificationSchema as BaseNotificationSchema,
  ClientNotificationSchema,
  ServerNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { SchemaOutput } from "@modelcontextprotocol/sdk/server/zod-compat.js";

/**
 * Internal dependencies
 */

export const NotificationSchema = ClientNotificationSchema.or(
  ServerNotificationSchema,
).or(BaseNotificationSchema);

export type Notification = SchemaOutput<typeof NotificationSchema>;
