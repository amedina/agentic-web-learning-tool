/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";
import { formatInputText } from "../utils/executorUtils";

/**
 * Prompt API (Language Model) executor.
 * Uses Chrome's built-in AI to generate responses.
 */
export async function promptApiExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  context: ExecutionContext
): Promise<string> {
  const {
    input,
    context: systemContext,
    temperature,
    topK,
    expectedInputsLanguages,
    expectedOutputsLanguages,
		initialPrompts,
  } = config as any;

  const formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error("Prompt API requires input text");
  }

  try {
    // Create session with options
    const sessionOptions: Record<string, unknown> = {};

    if (systemContext) {
      sessionOptions.initialPrompts = [
        {
          role: "system",
          content: systemContext,
        },
        ...(initialPrompts ?? []),
      ];
    } else {
      sessionOptions.initialPrompts = [];
    }

    if (temperature !== undefined) {
      sessionOptions.temperature = temperature;
    }

    if (topK !== undefined) {
      sessionOptions.topK = topK;
    }

    if (expectedInputsLanguages) {
      sessionOptions.expectedInputsLanguages = expectedInputsLanguages;
    }

    if (expectedOutputsLanguages) {
      sessionOptions.expectedOutputsLanguages = expectedOutputsLanguages;
    }

    if (expectedOutputsLanguages) {
      sessionOptions.expectedOutputsLanguages = expectedOutputsLanguages;
    }

    if (context.signal) {
      sessionOptions.signal = context.signal;
    }

    // @ts-ignore
    const session = await LanguageModel.create(sessionOptions);
    const response = await session.prompt(formattedInput);
    session.destroy?.();

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Prompt API execution failed: ${message}`);
  }
}
