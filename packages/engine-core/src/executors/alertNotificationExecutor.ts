/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

/**
 * Alert Notification executor.
 * Shows an alert with the input data.
 */
export async function alertNotificationExecutor(
  config: Record<string, unknown>,
  runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input as string | undefined;
  const title = config.title as string | undefined;

  const message = input ?? title ?? "Notification";

  await runtime.showAlert(message);

  return message;
}
