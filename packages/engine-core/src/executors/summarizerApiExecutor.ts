/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

/**
 * Summarizer API executor.
 * Uses Chrome's built-in Summarization API.
 */
export async function summarizerApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input as string | undefined;
  const type = config.type as
    | "key-points"
    | "tldr"
    | "teaser"
    | "headline"
    | undefined;
  const length = config.length as "short" | "medium" | "long" | undefined;
  const sharedContext = config.context as string | undefined;
	const format = config.format as "markdown" | "plain-text" | undefined;
	const expectedInputLanguages = config.expectedInputLanguages as string[] | undefined;
	const outputLanguage = config.outputLanguage as string | undefined;

  if (!input) {
    throw new Error("Summarizer API requires input text");
  }

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

    // @ts-ignore
    const summarizer = await Summarizer.create(options);
    const summary = await summarizer.summarize(input);

    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Summarizer API execution failed: ${message}`);
  }
}
