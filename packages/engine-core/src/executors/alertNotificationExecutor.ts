/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";
import { formatInputText } from "../utils/executorUtils";

/**
 * Alert Notification executor.
 * Shows an alert with the input data.
 */
export async function alertNotificationExecutor(
  config: Record<string, unknown>,
  runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const title = config.title as string | undefined;
  const useCustomMessage = !!config.useCustomMessage;
  const configMessage = (config.message as string) || "";

  const formattedInput = formatInputText(input);

  const message = useCustomMessage
    ? configMessage || "No message provided"
    : formattedInput || title || "Notification";

  await runtime.showAlert(message);

  return message;
}
