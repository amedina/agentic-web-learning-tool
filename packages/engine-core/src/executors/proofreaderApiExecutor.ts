/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

/**
 * Proofreader API executor.
 * Uses Chrome's built-in AI for proofreading/grammar checking.
 */
export async function proofreaderApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input as string | undefined;
  const expectedInputLanguages = config.expectedInputLanguages as
    | string[]
    | undefined;

  if (!input) {
    throw new Error("Proofreader API requires input text");
  }

  try {
    // @ts-ignore
    const proofreader = await Proofreader.create({
      expectedInputLanguages,
    });

    const results = await proofreader.proofread(input);
		const corrections = results.corrections;

    let inputRenderIndex = 0;
    let correctedText = "";

    for (const correction of corrections) {
      if (correction.startIndex > inputRenderIndex) {
        correctedText += input.substring(inputRenderIndex, correction.startIndex);
      }

      const suggestion = (correction as any).suggestions?.[0];
      correctedText += suggestion ?? input.substring(correction.startIndex, correction.endIndex);

      inputRenderIndex = correction.endIndex;
    }

    if (inputRenderIndex < input.length) {
      correctedText += input.substring(inputRenderIndex);
    }

    return correctedText;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Proofreader API execution failed: ${message}`);
  }
}
