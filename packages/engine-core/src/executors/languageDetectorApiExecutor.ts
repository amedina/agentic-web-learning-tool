/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

/**
 * Language Detector API executor.
 * Uses Chrome's built-in Language Detection API.
 */
export async function languageDetectorApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input as string | undefined;

  if (!input) {
    throw new Error("Language Detector API requires input text");
  }

  try {
    // @ts-ignore
    const languageDetector = await LanguageDetector.create();

    const results = await languageDetector.detect(input);

    if (results && results.length > 0) {
      const sorted = results.sort(
        (a: { confidence: number }, b: { confidence: number }) =>
          b.confidence - a.confidence
      );

      return sorted[0].detectedLanguage;
    }

    return "";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Language Detector API execution failed: ${message}`);
  }
}
