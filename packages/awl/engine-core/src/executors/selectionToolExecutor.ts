/**
 * Internal dependencies
 */
import type { RuntimeInterface } from '../runtime';

/**
 * Selection Tool executor.
 * Pauses execution and waits for user to select text on the page.
 */
export async function selectionToolExecutor(
  _config: Record<string, unknown>,
  runtime: RuntimeInterface
): Promise<string> {
  return runtime.waitForSelection();
}
