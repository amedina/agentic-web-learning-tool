/**
 * Internal dependencies
 */
import type { ToolExecutionArgs } from "../../types";

/**
 * Removes null or undefined values from the arguments object.
 * specific LLMs/Transports fail if nulls are passed explicitly.
 */
function cleanArguments(args: ToolExecutionArgs): ToolExecutionArgs {
  return Object.fromEntries(
    Object.entries(args).filter(([, v]) => v !== null && v !== undefined),
  );
}

export default cleanArguments;
