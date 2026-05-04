/**
 * Minimal stand-in for the `vscode` module so unit tests can run outside
 * the extension host. Only the surface used by source files under test
 * lives here — extend as new features need more API.
 */

/**
 * Test stand-in for vscode.Position. Implements the structural surface
 * tsc requires (line, character, comparison helpers) but with no-op
 * stubs for translate / with since tests do not rely on those.
 */
export class Position {
  readonly line: number;
  readonly character: number;

  /** Stores the zero-based line and character offsets. */
  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }

  /** True when this position lies strictly before `other`. */
  isBefore(other: Position): boolean {
    return this.compareTo(other) < 0;
  }

  /** True when this position is equal to or before `other`. */
  isBeforeOrEqual(other: Position): boolean {
    return this.compareTo(other) <= 0;
  }

  /** True when this position lies strictly after `other`. */
  isAfter(other: Position): boolean {
    return this.compareTo(other) > 0;
  }

  /** True when this position is equal to or after `other`. */
  isAfterOrEqual(other: Position): boolean {
    return this.compareTo(other) >= 0;
  }

  /** True when both line and character match `other`. */
  isEqual(other: Position): boolean {
    return this.line === other.line && this.character === other.character;
  }

  /** Negative / zero / positive when this is before / equal / after `other`. */
  compareTo(other: Position): number {
    if (this.line !== other.line) {
      return this.line - other.line;
    }
    return this.character - other.character;
  }

  /** Stub: tests don't exercise translate; returns the same position. */
  translate(_change?: unknown): Position {
    return this;
  }

  /** Stub: tests don't exercise `with`; returns the same position. */
  with(_change?: unknown): Position {
    return this;
  }
}

/**
 * Test stand-in for vscode.Range. Implements contains / isEqual /
 * isEmpty / isSingleLine because the parser tests inspect them, but
 * leaves intersection / union / with as minimal stubs.
 */
export class Range {
  readonly start: Position;
  readonly end: Position;

  /** Stores the inclusive start and exclusive end positions. */
  constructor(start: Position, end: Position) {
    this.start = start;
    this.end = end;
  }

  /** True when start and end positions are identical. */
  get isEmpty(): boolean {
    return (
      this.start.line === this.end.line &&
      this.start.character === this.end.character
    );
  }

  /** True when the range does not span more than one line. */
  get isSingleLine(): boolean {
    return this.start.line === this.end.line;
  }

  /** True when this range contains the given position or sub-range. */
  contains(positionOrRange: Position | Range): boolean {
    const before = (a: Position, b: Position) =>
      a.line < b.line || (a.line === b.line && a.character <= b.character);
    if (positionOrRange instanceof Range) {
      return (
        before(this.start, positionOrRange.start) &&
        before(positionOrRange.end, this.end)
      );
    }
    return (
      before(this.start, positionOrRange) && before(positionOrRange, this.end)
    );
  }

  /** True when both start and end positions match the other range. */
  isEqual(other: Range): boolean {
    return (
      this.start.line === other.start.line &&
      this.start.character === other.start.character &&
      this.end.line === other.end.line &&
      this.end.character === other.end.character
    );
  }

  /** Stub: tests don't exercise intersection; always returns undefined. */
  intersection(_other: Range): Range | undefined {
    return undefined;
  }

  /** Returns the smallest range covering both this range and `other`. */
  union(other: Range): Range {
    return new Range(this.start, other.end);
  }

  /** Stub: tests don't exercise `with`; returns the same range. */
  with(_change?: unknown): Range {
    return this;
  }
}

export const DiagnosticSeverity = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Hint: 3,
} as const;

/**
 * Test stand-in for vscode.Diagnostic. Holds the same fields the real
 * class does (range, message, severity, source, code) so rule tests
 * can assert against them.
 */
export class Diagnostic {
  source?: string;
  code?: string | number;
  readonly range: Range;
  readonly message: string;
  readonly severity: number;

  /** Stores the diagnostic's range, message text, and severity tier. */
  constructor(range: Range, message: string, severity: number) {
    this.range = range;
    this.message = message;
    this.severity = severity;
  }
}

type Listener<T> = (event: T) => void;
interface Disposable {
  dispose(): void;
}

/**
 * Test stand-in for vscode.commands. Tests can spy on
 * `commands.executeCommand` to verify side-effect calls without
 * touching the real extension host.
 */
export const commands = {
  executeCommand: async (..._args: unknown[]): Promise<unknown> => undefined,
};

/**
 * Test stand-in for vscode.Uri. Stores the original string and
 * exposes a `parse` factory (matching the real Uri.parse usage in
 * the bridge) plus toString so equality assertions work.
 */
export class Uri {
  private readonly value: string;

  /** Stores the URI string verbatim. */
  private constructor(value: string) {
    this.value = value;
  }

  /** Parses an arbitrary URI string into a stub Uri. */
  static parse(value: string): Uri {
    return new Uri(value);
  }

  /** Returns the original URI string. */
  toString(): string {
    return this.value;
  }
}

/**
 * Test stand-in for vscode.window. Tests can spy on
 * `window.showTextDocument` to verify the bridge opens a file
 * without touching real editors.
 */
export const window = {
  showTextDocument: async (
    _uri: unknown,
    _options?: unknown,
  ): Promise<unknown> => undefined,
};

/**
 * Test stand-in for vscode.EventEmitter. Mirrors the listener-set /
 * fire / dispose API the real class exposes so source code that uses
 * `new vscode.EventEmitter()` works unchanged in tests.
 */
export class EventEmitter<T> {
  private readonly listeners = new Set<Listener<T>>();

  /** Subscribes the listener and returns a Disposable that removes it. */
  event = (listener: Listener<T>): Disposable => {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  };

  /** Synchronously invokes every registered listener with `event`. */
  fire(event: T): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /** Drops every listener; idempotent. */
  dispose(): void {
    this.listeners.clear();
  }
}
