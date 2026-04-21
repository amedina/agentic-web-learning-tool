/**
 * Internal dependencies
 */
import type { ExecutionContext } from '../types';
import type { RuntimeInterface } from '../runtime';
import { formatInputText } from '../utils/executorUtils';

type MathOperation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'root'
  | 'round'
  | 'floor'
  | 'ceil'
  | 'abs';

/**
 * Math tool executor.
 */
export const mathExecutor = async (
  config: Record<string, any>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> => {
  const inputStr = formatInputText(config.input);
  const inputNum = parseFloat(inputStr);

  if (isNaN(inputNum)) {
    return 'NaN';
  }

  const operation = config.operation as MathOperation;
  const operandStr = (config.operand as string) || '0';
  const operand = parseFloat(operandStr);

  let result: number;

  switch (operation) {
    case 'add':
      result = inputNum + operand;
      break;
    case 'subtract':
      result = inputNum - operand;
      break;
    case 'multiply':
      result = inputNum * operand;
      break;
    case 'divide':
      result = operand !== 0 ? inputNum / operand : Infinity;
      break;
    case 'power':
      result = Math.pow(inputNum, operand);
      break;
    case 'root':
      // If operand is not provided or 0, default to square root
      const rootBase = operand || 2;
      result = Math.pow(inputNum, 1 / rootBase);
      break;
    case 'round':
      result = Math.round(inputNum);
      break;
    case 'floor':
      result = Math.floor(inputNum);
      break;
    case 'ceil':
      result = Math.ceil(inputNum);
      break;
    case 'abs':
      result = Math.abs(inputNum);
      break;
    default:
      return inputStr;
  }

  return String(result);
};
