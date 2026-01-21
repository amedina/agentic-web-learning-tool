/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";
import { formatInputText } from "../utils/executorUtils";

/**
 * Tooltip executor.
 * Shows a tooltip with the input text next to elements matching the selector.
 */
export async function tooltipExecutor(
  config: Record<string, unknown>,
  runtime: RuntimeInterface,
  _context: ExecutionContext,
): Promise<string> {
  const input = config.input;
  const selector = config.selector as string;

  if (!selector) {
    throw new Error("Tooltip requires a CSS selector");
  }

  const formattedInput = formatInputText(input);

  if (!formattedInput) {
    throw new Error("Tooltip requires input description/text");
  }

  await runtime.showTooltip(selector, formattedInput);

  return formattedInput;
}
