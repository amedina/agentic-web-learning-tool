/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

/**
 * Translator API executor.
 * Uses Chrome's built-in Translation API.
 */
export async function translatorApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input as string | undefined;
  const sourceLanguage = config.sourceLanguage as string | undefined;
  const targetLanguage = config.targetLanguage as string | undefined;

  if (!input) {
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

    const result = await translator.translate(input);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Translator API execution failed: ${message}`);
  }
}
