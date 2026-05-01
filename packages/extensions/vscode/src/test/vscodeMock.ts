/**
 * Minimal stand-in for the `vscode` module so unit tests can run outside
 * the extension host. Only the surface used by source files under test
 * lives here — extend as new features need more API.
 */

export class Position {
  readonly line: number;
  readonly character: number;

  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }

  isBefore(other: Position): boolean {
    return this.compareTo(other) < 0;
  }

  isBeforeOrEqual(other: Position): boolean {
    return this.compareTo(other) <= 0;
  }

  isAfter(other: Position): boolean {
    return this.compareTo(other) > 0;
  }

  isAfterOrEqual(other: Position): boolean {
    return this.compareTo(other) >= 0;
  }

  isEqual(other: Position): boolean {
    return this.line === other.line && this.character === other.character;
  }

  compareTo(other: Position): number {
    if (this.line !== other.line) {
      return this.line - other.line;
    }
    return this.character - other.character;
  }

  translate(_change?: unknown): Position {
    return this;
  }

  with(_change?: unknown): Position {
    return this;
  }
}

export class Range {
  readonly start: Position;
  readonly end: Position;

  constructor(start: Position, end: Position) {
    this.start = start;
    this.end = end;
  }

  get isEmpty(): boolean {
    return (
      this.start.line === this.end.line &&
      this.start.character === this.end.character
    );
  }

  get isSingleLine(): boolean {
    return this.start.line === this.end.line;
  }

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

  isEqual(other: Range): boolean {
    return (
      this.start.line === other.start.line &&
      this.start.character === other.start.character &&
      this.end.line === other.end.line &&
      this.end.character === other.end.character
    );
  }

  intersection(_other: Range): Range | undefined {
    return undefined;
  }

  union(other: Range): Range {
    return new Range(this.start, other.end);
  }

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

export class Diagnostic {
  source?: string;
  code?: string | number;
  readonly range: Range;
  readonly message: string;
  readonly severity: number;

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

export class EventEmitter<T> {
  private readonly listeners = new Set<Listener<T>>();

  event = (listener: Listener<T>): Disposable => {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  };

  fire(event: T): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  dispose(): void {
    this.listeners.clear();
  }
}
