/**
 * Internal dependencies.
 */
import type { ExecutionContext } from '../types';
import type { RuntimeInterface } from '../runtime';
import { formatInputText } from '../utils/executorUtils';

/**
 * Proofreader API executor.
 * Uses Chrome's built-in AI for proofreading/grammar checking.
 */
export async function proofreaderApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const expectedInputLanguages = config.expectedInputLanguages as
    | string[]
    | undefined;

  const formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error('Proofreader API requires input text');
  }

  try {
    // @ts-ignore
    const proofreader = await Proofreader.create({
      expectedInputLanguages,
      signal: context.signal,
    });

    const results = await proofreader.proofread(formattedInput);
    const corrections = results.corrections;

    let inputRenderIndex = 0;
    let correctedText = '';

    for (const correction of corrections) {
      if (correction.startIndex > inputRenderIndex) {
        correctedText += formattedInput.substring(
          inputRenderIndex,
          correction.startIndex
        );
      }

      const suggestion = (correction as any).suggestions?.[0];
      correctedText +=
        suggestion ??
        formattedInput.substring(correction.startIndex, correction.endIndex);

      inputRenderIndex = correction.endIndex;
    }

    if (inputRenderIndex < formattedInput.length) {
      correctedText += formattedInput.substring(inputRenderIndex);
    }

    return correctedText;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Proofreader API execution failed: ${message}`);
  }
}
