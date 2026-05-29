/**
 * External dependencies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { runProjectAnalysis } from "../projectAnalysisRunner";

const analyzeProjectMock = vi.fn();

vi.mock("@agentic-web-labs/project-analyzer-core", () => ({
  analyzeProject: (...args: unknown[]) => analyzeProjectMock(...args),
}));

/** Minimal stand-in DiagnosticCollection that records the calls we assert on. */
function createCollection(): vscode.DiagnosticCollection {
  return {
    clear: vi.fn(),
    set: vi.fn(),
  } as unknown as vscode.DiagnosticCollection;
}

const emptyAnalysis = {
  rootPath: "/repo",
  packageManager: undefined,
  findings: [],
  summary: {
    total: 0,
    bySeverity: { error: 0, warning: 0, info: 0, hint: 0 },
    bySource: { publint: 0, replacements: 0, "circular-deps": 0 },
  },
  warnings: [],
};

describe("runProjectAnalysis", () => {
  beforeEach(() => {
    analyzeProjectMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the analysis when analyzeProject resolves", async () => {
    analyzeProjectMock.mockResolvedValue(emptyAnalysis);
    const collection = createCollection();

    const result = await runProjectAnalysis(collection, { rootPath: "/repo" });

    expect(result.analysis).toEqual(emptyAnalysis);
    expect(collection.clear).toHaveBeenCalledTimes(1);
  });

  it("rejects with a timeout error when analyzeProject never settles", async () => {
    vi.useFakeTimers();
    // A promise that never resolves models a hung publint / madge / fetch.
    analyzeProjectMock.mockReturnValue(new Promise<never>(() => undefined));
    const collection = createCollection();

    const promise = runProjectAnalysis(collection, { rootPath: "/repo" });
    // Swallow here so advancing the timers doesn't surface an unhandled
    // rejection before we assert on it below.
    promise.catch(() => undefined);

    await vi.advanceTimersByTimeAsync(90_000);

    await expect(promise).rejects.toThrow(/timed out/);
    expect(collection.clear).not.toHaveBeenCalled();
  });
});
