import type { ExecutionContext } from '../types';
import type { RuntimeInterface } from '../runtime';
import { formatInputText } from '../utils/executorUtils';

/**
 * Supported comparison operators for conditions.
 */
type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'greaterThan'
  | 'lessThan';

/**
 * Condition executor.
 * Evaluates a condition and returns a boolean or the input value.
 */
export async function conditionExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const operator = (config.operator as ComparisonOperator) ?? 'isNotEmpty';
  const compareValue = config.compareValue as string | undefined;

  const inputStr = formatInputText(input);

  const successMessage =
    'Comparison was success for the concerned input with a target value: ' +
    inputStr;
  const failureMessage =
    'Comparison was failure for the concerned input with a target value: ' +
    inputStr;

  switch (operator) {
    case 'equals':
      return inputStr === (compareValue ?? '')
        ? successMessage
        : failureMessage;

    case 'notEquals':
      return inputStr !== (compareValue ?? '')
        ? successMessage
        : failureMessage;

    case 'contains':
      return inputStr.includes(compareValue ?? '')
        ? successMessage
        : failureMessage;

    case 'notContains':
      return !inputStr.includes(compareValue ?? '')
        ? successMessage
        : failureMessage;

    case 'startsWith':
      return inputStr.startsWith(compareValue ?? '')
        ? successMessage
        : failureMessage;

    case 'endsWith':
      return inputStr.endsWith(compareValue ?? '')
        ? successMessage
        : failureMessage;

    case 'isEmpty':
      return inputStr.trim().length === 0 ? successMessage : failureMessage;

    case 'isNotEmpty':
      return inputStr.trim().length > 0 ? successMessage : failureMessage;

    case 'greaterThan': {
      const numInput = parseFloat(inputStr);
      const numCompare = parseFloat(compareValue ?? '0');
      return !isNaN(numInput) && !isNaN(numCompare) && numInput > numCompare
        ? successMessage
        : failureMessage;
    }

    case 'lessThan': {
      const numInput = parseFloat(inputStr);
      const numCompare = parseFloat(compareValue ?? '0');
      return !isNaN(numInput) && !isNaN(numCompare) && numInput < numCompare
        ? successMessage
        : failureMessage;
    }

    default:
      return inputStr.trim().length > 0 ? successMessage : failureMessage;
  }
}
