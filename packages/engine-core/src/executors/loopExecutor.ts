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
  context,
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

  for (let i = 0; i < input.length; i++) {
    const item = input[i];

    // Set loop context for downstream nodes
    if (context) {
      context.loop = {
        index: i,
        total: input.length,
      };
    }

    const itemResult = await executeBranch("item", item);
    results.push(itemResult);
  }

  // Cleanup loop context
  if (context) {
    delete context.loop;
  }

  return results;
};
