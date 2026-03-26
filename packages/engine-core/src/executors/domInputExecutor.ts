/**
 * Internal dependencies
 */
import type { ExecutionContext } from '../types';
import type { RuntimeInterface } from '../runtime';

/**
 * DOM Input executor.
 * Queries the active page's DOM and extracts text content.
 */
export async function domInputExecutor(
  config: Record<string, unknown>,
  runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<unknown> {
  const selector = config.cssSelector as string | undefined;
  const extract =
    (config.extract as
      | 'textContent'
      | 'innerText'
      | 'innerHTML'
      | 'value'
      | 'src'
      | 'href') ?? 'textContent';
  const defaultValue = config.defaultValue as string | undefined;
  const isMultiple = (config.isMultiple as boolean) ?? false;

  if (!selector) {
    if (defaultValue) {
      return defaultValue;
    }
    throw new Error('DOM Input requires a CSS selector');
  }

  try {
    let result = await runtime.queryPage(selector, extract, isMultiple);

    result = !isMultiple
      ? result
      : (result as Array<string>).filter((item) => item);

    return result || defaultValue || (isMultiple ? [] : '');
  } catch (error) {
    // If DOM query fails, fall back to default value
    if (defaultValue) {
      return defaultValue;
    }
    throw error;
  }
}
