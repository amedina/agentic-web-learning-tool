/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";
import { formatInputText } from "../utils/executorUtils";

/**
 * Clipboard Writer executor.
 * Copies the input text to the system clipboard.
 */
export async function clipboardWriterExecutor(
  config: Record<string, unknown>,
  runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input;

  const formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error("Clipboard Writer requires input text");
  }

  await runtime.copyToClipboard(formattedInput);

  return formattedInput;
}
