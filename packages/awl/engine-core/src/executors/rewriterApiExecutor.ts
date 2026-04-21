/**
 * Internal dependencies.
 */
import type { ExecutionContext } from '../types';
import type { RuntimeInterface } from '../runtime';
import { formatInputText } from '../utils/executorUtils';

/**
 * Rewriter API executor.
 * Uses Chrome's built-in Rewriter API for content rewriting.
 */
export async function rewriterApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const sharedContext = config.sharedContext as string | undefined;
  const tone = config.tone as
    | 'as-is'
    | 'more-formal'
    | 'more-casual'
    | undefined;
  const length = config.length as 'as-is' | 'shorter' | 'longer' | undefined;
  const format = config.format as
    | 'as-is'
    | 'markdown'
    | 'plain-text'
    | undefined;
  const expectedInputLanguages = config.expectedInputLanguages as
    | string[]
    | undefined;
  const outputLanguage = config.outputLanguage as string | undefined;

  let formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error('Rewriter API requires input text');
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

    if (outputLanguage) {
      options.outputLanguage = outputLanguage;
    }

    if (context.signal) {
      options.signal = context.signal;
    }

    // @ts-ignore
    const rewriter = await Rewriter.create(options);

    if (
      (await rewriter.measureInputUsage(formattedInput)) > rewriter.inputQuota
    ) {
      let low = 0;
      let high = formattedInput.length;
      let optimalLength = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        if (
          (await rewriter.measureInputUsage(formattedInput.slice(0, mid))) <=
          rewriter.inputQuota
        ) {
          optimalLength = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      formattedInput = formattedInput.slice(0, optimalLength);
    }

    const result = await rewriter.rewrite(formattedInput);
    rewriter.destroy?.();

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Rewriter API execution failed: ${message}`);
  }
}
