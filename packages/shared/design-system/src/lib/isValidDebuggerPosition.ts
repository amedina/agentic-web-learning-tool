/**
 * External dependencies
 */
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
/**
 * Internal dependencies
 */
import { splitLines, joinLines, isEmptyOrWhitespace, isComment } from './utils';

export interface BreakpointOptions {
  line: number;
  column?: number;
  allowGlobal?: boolean;
}

export interface BreakpointResult {
  success: boolean;
  adjustedLine?: number;
  reason?: string;
  code?: string;
}

type ExecutableMap = Map<number, boolean>;
type FunctionSet = Set<number>;

/**
 * Analyzes the source code to identify executable lines and function definitions.
 *
 * @param code - The source code to analyze.
 * @returns An object containing a map of executable lines and a set of function start lines.
 */
function analyzeCode(code: string): {
  executableLines: ExecutableMap;
  functionLines: FunctionSet;
} {
  const executableLines: ExecutableMap = new Map();
  const functionLines: FunctionSet = new Set();

  const ast = parse(code, {
    sourceType: 'unambiguous',
    plugins: ['typescript', 'jsx'],
    errorRecovery: true,
  });

  traverse(ast, {
    enter(path) {
      const node = path.node;

      if (node.loc) {
        const line = node.loc.start.line;

        if (t.isStatement(node)) {
          executableLines.set(line, true);
        }

        if (t.isFunction(node) || t.isArrowFunctionExpression(node)) {
          for (
            let index = node.loc?.start.line;
            index <= node.loc?.end.line;
            index++
          ) {
            functionLines.add(index);
          }
        }
      }
    },
  });

  return { executableLines, functionLines };
}

/**
 * Checks if a line is executable.
 *
 * @param executableLines - A map of executable lines.
 * @param line - The line number to check.
 * @returns True if the line is executable, false otherwise.
 */
function isExecutable(executableLines: ExecutableMap, line: number): boolean {
  return executableLines.has(line);
}

/**
 * Finds the next executable line in the source code.
 *
 * @param executableLines - A map of executable lines.
 * @param line - The current line number.
 * @param max - The maximum line number in the source code.
 * @returns The next executable line number, or null if no executable line is found.
 */
function findNextExecutable(
  executableLines: ExecutableMap,
  line: number,
  max: number
): number | null {
  for (let i = line; i <= max; i++) {
    if (isExecutable(executableLines, i)) return i;
  }
  return null;
}

/**
 * Validates if the specified line is within a function scope.
 *
 * @param functionLines - A set of function start lines.
 * @param line - The line number to validate.
 * @param allowGlobal - Whether to allow breakpoints in global scope.
 * @returns True if the line is within a function scope, false otherwise.
 */
function validateGlobalScope(
  functionLines: FunctionSet,
  line: number,
  allowGlobal?: boolean
): boolean {
  if (allowGlobal) return true;
  return functionLines.has(line);
}

/**
 * Inserts a debugger statement at the specified line in the source code.
 *
 * @param code - The source code to modify.
 * @param options - The breakpoint options.
 * @returns The modified source code with the debugger statement inserted.
 */
export function insertDebugger(
  code: string,
  options: BreakpointOptions
): BreakpointResult {
  if (!code) {
    return { success: false, reason: 'Empty code' };
  }

  const { line } = options;

  const { executableLines, functionLines } = analyzeCode(code);

  const lines = splitLines('\n' + code);

  if (line < 1 || line > lines.length) {
    return { success: false, reason: 'Invalid line number' };
  }

  let target = line;

  // Global scope check
  if (!validateGlobalScope(functionLines, target, options.allowGlobal)) {
    return {
      success: false,
      reason: 'Cannot add breakpoint in global scope',
    };
  }

  lines.forEach((_, index) => {
    if (index >= line) {
      if (isEmptyOrWhitespace(lines[target]) || isComment(lines[target])) {
        target++;
      }
    }
  });

  // Find executable
  if (!isExecutable(executableLines, target)) {
    const adjusted = findNextExecutable(executableLines, target, lines.length);

    if (!adjusted) {
      return {
        success: false,
        reason: 'No executable statement found',
      };
    }

    target = adjusted;
  }

  return {
    success: true,
    adjustedLine: target,
    code: joinLines(lines),
  };
}
