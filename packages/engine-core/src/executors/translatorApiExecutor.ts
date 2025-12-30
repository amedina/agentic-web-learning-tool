/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";
import { formatInputText } from "../utils/executorUtils";

/**
 * Translator API executor.
 * Uses Chrome's built-in Translation API.
 */
export async function translatorApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const sourceLanguage = config.sourceLanguage as string | undefined;
  const targetLanguage = config.targetLanguage as string | undefined;

  const formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error("Translator API requires input text");
  }

  if (!targetLanguage) {
    throw new Error("Translator API requires a target language");
  }

  try {
    //@ts-ignore
    const translator = await Translator.create({
      sourceLanguage: sourceLanguage || "en",
      targetLanguage,
    });

    const result = await translator.translate(formattedInput);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Translator API execution failed: ${message}`);
  }
}
