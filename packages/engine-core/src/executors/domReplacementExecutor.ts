/**
 * Internal dependencies
 */
import type { ExecutionContext } from '../types';
import type { RuntimeInterface } from '../runtime';
import { formatInputText } from '../utils/executorUtils';

/**
 * DOM Replacement executor.
 * Finds elements by CSS selector and replaces their content with the input.
 */
export async function domReplacementExecutor(
  config: Record<string, unknown>,
  runtime: RuntimeInterface,
  context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const selector = config.selector as string;
  const isMultiple = !!config.isMultiple;
  const replaceSelection = !!config.replaceSelection;

  const mode = config.mode as
    | 'textContent'
    | 'innerText'
    | 'innerHTML'
    | 'value'
    | undefined;

  const formattedInput = formatInputText(input);

  if (replaceSelection) {
    if (!formattedInput) {
      throw new Error('Selection replacement requires input text');
    }
    await runtime.replaceSelection(formattedInput);
    return formattedInput;
  }

  if (!selector) {
    throw new Error(
      'DOM Replacement requires a CSS selector or replaceSelection mode'
    );
  }

  if (!formattedInput) {
    throw new Error('DOM Replacement requires input text');
  }

  await runtime.replaceDOM(
    selector,
    formattedInput,
    isMultiple,
    mode,
    context.loop?.index
  );

  return formattedInput;
}
