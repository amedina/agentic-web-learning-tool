import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";
import { formatInputText } from "../utils/executorUtils";

/**
 * Rewriter API executor.
 * Uses Chrome's built-in Rewriter API for content rewriting.
 */
export async function rewriterApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const sharedContext = config.sharedContext as string | undefined;
  const tone = config.tone as
    | "as-is"
    | "more-formal"
    | "more-casual"
    | undefined;
  const length = config.length as "as-is" | "shorter" | "longer" | undefined;
  const format = config.format as
    | "as-is"
    | "markdown"
    | "plain-text"
    | undefined;
  const expectedInputLanguages = config.expectedInputLanguages as
    | string[]
    | undefined;
  const outputLanguage = config.outputLanguage as string | undefined;

  const formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error("Rewriter API requires input text");
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

    // @ts-ignore
    const rewriter = await Rewriter.create(options);
    const result = await rewriter.rewrite(formattedInput);
    rewriter.destroy?.();

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Rewriter API execution failed: ${message}`);
  }
}
