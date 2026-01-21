/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";
import { formatInputText } from "../utils/executorUtils";

/**
 * File Creator executor.
 * Downloads the input text as a file.
 */
export async function fileCreatorExecutor(
  config: Record<string, unknown>,
  runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const filename = (config.filename as string) || "output.txt";

  const formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error("File Creator requires input text");
  }

  await runtime.downloadFile(filename, formattedInput);

  return formattedInput;
}
