/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";
import { formatInputText } from "../utils/executorUtils";

/**
 * Summarizer API executor.
 * Uses Chrome's built-in Summarization API.
 */
export async function summarizerApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const type = config.type as
    | "key-points"
    | "tldr"
    | "teaser"
    | "headline"
    | undefined;
  const length = config.length as "short" | "medium" | "long" | undefined;
  const sharedContext = config.context as string | undefined;
  const format = config.format as "markdown" | "plain-text" | undefined;
  const expectedInputLanguages = config.expectedInputLanguages as
    | string[]
    | undefined;
  const outputLanguage = config.outputLanguage as string | undefined;

  const formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error("Summarizer API requires input text");
  }

  let summarizer: any; // Declare summarizer outside try block to be accessible in finally
  try {
    const options: Record<string, unknown> = {};
    if (type) {
      options.type = type;
    }
    if (length) {
      options.length = length;
    }
    if (sharedContext) {
      options.sharedContext = sharedContext;
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

    if (outputLanguage) {
      options.outputLanguage = outputLanguage;
    }

    if (context.signal) {
      options.signal = context.signal;
    }

    // @ts-ignore
    summarizer = await Summarizer.create(options);
    const summary = await summarizer.summarize(formattedInput);

    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Summarizer API execution failed: ${message}`);
  } finally {
    if (summarizer) {
      await summarizer.destroy();
    }
  }
}
