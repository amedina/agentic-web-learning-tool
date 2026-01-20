/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

/**
 * Writer API executor.
 * Uses Chrome's built-in Writer API for content generation.
 */
export async function writerApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input as string | undefined;
  const sharedContext = config.sharedContext as string | undefined;
  const tone = config.tone as "formal" | "neutral" | "casual" | undefined;
  const length = config.length as "short" | "medium" | "long" | undefined;
  const format = config.format as "markdown" | "plain-text" | undefined;
  const expectedInputLanguages = config.expectedInputLanguages as
    | string[]
    | undefined;
  const outputLanguage = config.outputLanguage as string | undefined;

  if (!input) {
    throw new Error("Writer API requires input/prompt text");
  }

  try {
    const options: Record<string, unknown> = {};
    if (sharedContext) {
      options.sharedContext = sharedContext;
    }
    if (tone) {
      options.tone = tone;
    }
    if (length) {
      options.length = length;
    }
    if (format) {
      options.format = format;
    }
    if (expectedInputLanguages) {
      options.expectedInputLanguages = expectedInputLanguages;
    }
    if (outputLanguage) {
      options.outputLanguage = outputLanguage;
    }

    //@ts-ignore
    const writer = await Writer.create(options);
    const result = await writer.write(input);

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Writer API execution failed: ${message}`);
  }
}
