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
): Promise<unknown> {
  const { inputValue, isMultiple } = config;

  if (isMultiple) {
    try {
      const parsed = JSON.parse(inputValue as string);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      console.warn("Failed to parse static input as JSON array:", inputValue);
      return [inputValue];
    }
  }

  return typeof inputValue === "string" ? inputValue : "";
}
