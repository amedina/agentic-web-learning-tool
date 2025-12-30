/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";
import { formatInputText } from "../utils/executorUtils";

/**
 * Text to Speech executor.
 * Reads the input text aloud using the browser's TTS API.
 */
export async function textToSpeechExecutor(
  config: Record<string, unknown>,
  runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input;

  const formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error("Text to Speech requires input text");
  }

  await runtime.speakText(formattedInput);

  return formattedInput;
}
