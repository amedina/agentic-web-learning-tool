/**
 * External dependencies.
 */
import { beforeEach, describe, expect, it } from "vitest";
import type * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { DiagnosticsRunner } from "../runner";

/**
 * Manual timer harness used in lieu of vi.useFakeTimers. Lets each
 * test step through pending callbacks deterministically without
 * touching any other timer-using module.
 */
function makeScheduler() {
  let nextId = 1;
  const handlers = new Map<number, () => void>();
  return {
    scheduler: {
      setTimeout: (handler: () => void, _ms: number) => {
        const id = nextId++;
        handlers.set(id, handler);
        return id;
      },
      clearTimeout: (handle: unknown) => {
        if (typeof handle === "number") {
          handlers.delete(handle);
        }
      },
    },
    /** Run every pending handler in registration order. */
    fireAll() {
      const pending = Array.from(handlers.values());
      handlers.clear();
      for (const handler of pending) {
        handler();
      }
    },
    pendingCount() {
      return handlers.size;
    },
  };
}

/** Build a minimal DiagnosticCollection stub the runner can write into. */
function makeCollection() {
  const deleted: string[] = [];
  const set: { uri: string; entries: unknown }[] = [];
  return {
    deleted,
    set,
    collection: {
      delete(uri: vscode.Uri) {
        deleted.push(uri.toString());
      },
      set(uri: vscode.Uri, entries: vscode.Diagnostic[]) {
        set.push({ uri: uri.toString(), entries });
      },
      // Implements just enough of DiagnosticCollection for the runner.
    } as unknown as vscode.DiagnosticCollection,
  };
}

/** Fake package.json document with the URI fields runner reads. */
function makeDocument(uriString: string): vscode.TextDocument {
  return {
    languageId: "json",
    uri: {
      toString: () => uriString,
      path: uriString.replace(/^file:\/\//, ""),
    },
  } as unknown as vscode.TextDocument;
}

/** Construct a runner with stub dependencies and a manual scheduler. */
function makeRunner() {
  const scheduler = makeScheduler();
  const { collection, deleted } = makeCollection();
  const runner = new DiagnosticsRunner({
    cache: { get: async () => null } as never,
    collection,
    settingsProvider: () => ({}) as never,
    lockfileResolver: { resolveVersion: async () => undefined } as never,
    scheduler: scheduler.scheduler,
  });
  return { runner, scheduler, deleted };
}

const PACKAGE_JSON_URI = "file:///workspace/package.json";

describe("DiagnosticsRunner.scheduleClear", () => {
  let runner: DiagnosticsRunner;
  let scheduler: ReturnType<typeof makeScheduler>;
  let deleted: string[];

  beforeEach(() => {
    ({ runner, scheduler, deleted } = makeRunner());
  });

  it("doesn't clear until the debounce window elapses", () => {
    runner.scheduleClear(makeDocument(PACKAGE_JSON_URI));
    expect(deleted).toEqual([]);
    scheduler.fireAll();
    expect(deleted).toEqual([PACKAGE_JSON_URI]);
  });

  it("coalesces a burst of edits into one clear", () => {
    const document = makeDocument(PACKAGE_JSON_URI);
    runner.scheduleClear(document);
    runner.scheduleClear(document);
    runner.scheduleClear(document);
    // Only the most recent timer survives; the earlier ones were
    // cancelled when the next call landed.
    expect(scheduler.pendingCount()).toBe(1);
    scheduler.fireAll();
    expect(deleted).toEqual([PACKAGE_JSON_URI]);
  });

  it("tracks separate timers per document", () => {
    const a = makeDocument("file:///workspace/a/package.json");
    const b = makeDocument("file:///workspace/b/package.json");
    runner.scheduleClear(a);
    runner.scheduleClear(b);
    expect(scheduler.pendingCount()).toBe(2);
    scheduler.fireAll();
    expect(deleted.sort()).toEqual(
      [
        "file:///workspace/a/package.json",
        "file:///workspace/b/package.json",
      ].sort(),
    );
  });

  it("ignores non-package.json documents", () => {
    const document = {
      languageId: "json",
      uri: {
        toString: () => "file:///workspace/tsconfig.json",
        path: "/workspace/tsconfig.json",
      },
    } as unknown as vscode.TextDocument;
    runner.scheduleClear(document);
    expect(scheduler.pendingCount()).toBe(0);
  });

  it("dispose() cancels pending clears so they never fire", () => {
    runner.scheduleClear(makeDocument(PACKAGE_JSON_URI));
    runner.dispose();
    scheduler.fireAll();
    expect(deleted).toEqual([]);
  });

  it("clear() cancels a pending debounced clear and fires immediately", () => {
    runner.scheduleClear(makeDocument(PACKAGE_JSON_URI));
    runner.clear(makeDocument(PACKAGE_JSON_URI));
    expect(scheduler.pendingCount()).toBe(0);
    expect(deleted).toEqual([PACKAGE_JSON_URI]);
  });
});
