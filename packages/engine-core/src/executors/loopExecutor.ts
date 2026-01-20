/**
 * Internal dependencies
 */
import type { NodeExecutor } from "../engine/NodeRegistry";

/**
 * Executor for the Loop node.
 * For now, it simply returns the input data which is expected to be an array.
 */
export const loopExecutor: NodeExecutor = async (
  config,
  _runtime,
  _context,
  executeBranch
) => {
  const input = (config as any).input;

  if (!executeBranch) {
    throw new Error("executeBranch is required for Loop executor");
  }

  if (!Array.isArray(input)) {
    console.warn("Loop input is not an array, treating as single-item array.");

    const result = await executeBranch("item", input);
    return [result];
  }

  const results: unknown[] = [];
  for (const item of input) {
    const itemResult = await executeBranch("item", item);
    results.push(itemResult);
  }

  return results;
};
