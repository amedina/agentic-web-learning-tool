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
}

export class Range {
  readonly start: Position;
  readonly end: Position;

  constructor(start: Position, end: Position) {
    this.start = start;
    this.end = end;
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
