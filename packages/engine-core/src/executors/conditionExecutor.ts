/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

/**
 * Supported comparison operators for conditions.
 */
type ComparisonOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty"
  | "greaterThan"
  | "lessThan";

/**
 * Condition executor.
 * Evaluates a condition and returns a boolean or the input value.
 */
export async function conditionExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<boolean | string> {
  const input = config.input as string | undefined;
  const operator = (config.operator as ComparisonOperator) ?? "isNotEmpty";
  const compareValue = config.compareValue as string | undefined;

  const inputStr = input ?? "";

  switch (operator) {
    case "equals":
      return inputStr === (compareValue ?? "");

    case "notEquals":
      return inputStr !== (compareValue ?? "");

    case "contains":
      return inputStr.includes(compareValue ?? "");

    case "notContains":
      return !inputStr.includes(compareValue ?? "");

    case "startsWith":
      return inputStr.startsWith(compareValue ?? "");

    case "endsWith":
      return inputStr.endsWith(compareValue ?? "");

    case "isEmpty":
      return inputStr.trim().length === 0;

    case "isNotEmpty":
      return inputStr.trim().length > 0;

    case "greaterThan": {
      const numInput = parseFloat(inputStr);
      const numCompare = parseFloat(compareValue ?? "0");
      return !isNaN(numInput) && !isNaN(numCompare) && numInput > numCompare;
    }

    case "lessThan": {
      const numInput = parseFloat(inputStr);
      const numCompare = parseFloat(compareValue ?? "0");
      return !isNaN(numInput) && !isNaN(numCompare) && numInput < numCompare;
    }

    default:
      return inputStr.trim().length > 0;
  }
}
