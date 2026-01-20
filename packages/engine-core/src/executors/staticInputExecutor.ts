/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

/**
 * Static Input executor.
 * Simply returns the configured default value as output.
 */
export async function staticInputExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const inputValue = config.inputValue;

  if (typeof inputValue === "string") {
    return inputValue;
  }

  return "";
}
