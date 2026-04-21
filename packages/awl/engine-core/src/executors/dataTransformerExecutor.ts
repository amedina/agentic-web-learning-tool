/**
 * Internal dependencies
 */
import type { ExecutionContext } from '../types';
import type { RuntimeInterface } from '../runtime';
import { formatInputText } from '../utils/executorUtils';

/**
 * Supported transformation operations.
 */
type TransformerOperation =
  | 'regex'
  | 'jsonParse'
  | 'format'
  | 'split'
  | 'join'
  | 'template'
  | 'filter'
  | 'map'
  | 'objectKeys'
  | 'objectValues';

/**
 * Data Transformer executor.
 * Performs various string transformation operations.
 */
export async function dataTransformerExecutor(
  config: Record<string, unknown>,
  _runtime: RuntimeInterface,
  _context: ExecutionContext
): Promise<string> {
  const input = config.input;
  const operation = (config.operation as TransformerOperation) ?? 'format';
  const inputStr = formatInputText(input);

  switch (operation) {
    case 'regex': {
      const pattern = config.pattern as string;
      const flags = (config.flags as string) ?? '';
      if (!pattern) return inputStr;

      try {
        const regex = new RegExp(pattern, flags);
        const match = inputStr.match(regex);
        return match ? match[1] || match[0] : '';
      } catch (error) {
        console.error('Regex error:', error);
        return inputStr;
      }
    }

    case 'jsonParse': {
      const path = config.path as string;
      try {
        const parsed = JSON.parse(inputStr);
        if (!path) return JSON.stringify(parsed);

        // Path accessor e.g. "user.name"
        const value = path
          .split('.')
          .reduce((obj: any, key) => obj?.[key], parsed);

        return typeof value === 'object'
          ? JSON.stringify(value)
          : String(value ?? '');
      } catch (error) {
        console.error('JSON parse error:', error);
        return inputStr;
      }
    }

    case 'format': {
      const formatType = config.formatType as string;
      switch (formatType) {
        case 'lowercase':
          return inputStr.toLowerCase();
        case 'uppercase':
          return inputStr.toUpperCase();
        case 'trim':
          return inputStr.trim();
        case 'length':
          return String(inputStr.length);
        default:
          return inputStr;
      }
    }

    case 'split': {
      const separator = (config.separator as string) || ',';
      const index = parseInt(config.index as string) || 0;
      const parts = inputStr.split(separator);

      return parts[index] || '';
    }

    case 'join': {
      const separator = (config.separator as string) || ',';

      try {
        const arr = JSON.parse(inputStr);
        if (Array.isArray(arr)) {
          return arr.join(separator);
        }

        return inputStr;
      } catch {
        return inputStr;
      }
    }

    case 'template': {
      const template = (config.template as string) || '{{input}}';
      return template.replace(/{{input}}/g, inputStr);
    }

    case 'filter': {
      const filterKey = config.filterKey as string;
      const filterValue = config.filterValue as string;

      try {
        const arr = JSON.parse(inputStr);
        if (!Array.isArray(arr)) return inputStr;
        if (!filterKey) return JSON.stringify(arr);

        const filtered = arr.filter((item) => {
          const val = String(item?.[filterKey] ?? '');
          return val === filterValue;
        });
        return JSON.stringify(filtered);
      } catch {
        return inputStr;
      }
    }

    case 'map': {
      const mapPath = config.mapPath as string;
      try {
        const arr = JSON.parse(inputStr);
        if (!Array.isArray(arr)) return inputStr;
        if (!mapPath) return JSON.stringify(arr);

        const mapped = arr.map((item) => {
          return mapPath.split('.').reduce((obj: any, key) => obj?.[key], item);
        });
        return JSON.stringify(mapped);
      } catch {
        return inputStr;
      }
    }

    case 'objectKeys': {
      try {
        const obj = JSON.parse(inputStr);
        if (typeof obj !== 'object' || obj === null) return inputStr;
        return JSON.stringify(Object.keys(obj));
      } catch {
        return inputStr;
      }
    }

    case 'objectValues': {
      try {
        const obj = JSON.parse(inputStr);
        if (typeof obj !== 'object' || obj === null) return inputStr;
        return JSON.stringify(Object.values(obj));
      } catch {
        return inputStr;
      }
    }

    default:
      return inputStr;
  }
}
