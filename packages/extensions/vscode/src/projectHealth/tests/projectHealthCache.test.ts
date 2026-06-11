/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { ProjectHealthCache } from "../projectHealthCache";
import { createInitialReport } from "../projectHealthReport";
import {
  PROJECT_HEALTH_SCHEMA_VERSION,
  type ProjectHealthReport,
} from "../types";

/** In-memory Memento satisfying the cache's storage contract. */
function createMemento(): vscode.Memento {
  const store = new Map<string, unknown>();
  return {
    get: <T>(key: string, defaultValue?: T) =>
      (store.has(key) ? (store.get(key) as T) : defaultValue) as T,
    update: async (key: string, value: unknown) => {
      if (value === undefined) {
        store.delete(key);
      } else {
        store.set(key, value);
      }
    },
    keys: () => Array.from(store.keys()),
  };
}

/** Builds a terminal-phase report finished at `generatedAt`. */
function completedReport(
  workspaceKey: string,
  generatedAt: number,
): ProjectHealthReport {
  return {
    ...createInitialReport(workspaceKey, workspaceKey, generatedAt),
    phase: "complete",
    generatedAt,
  };
}

describe("ProjectHealthCache", () => {
  it("round-trips a report", async () => {
    const cache = new ProjectHealthCache(createMemento());
    const report = completedReport("ws", 5000);

    await cache.set(report);

    expect(cache.get("ws")?.generatedAt).toBe(5000);
  });

  it("treats a schema-version mismatch as a miss", async () => {
    const memento = createMemento();
    const cache = new ProjectHealthCache(memento);
    const stale = {
      ...completedReport("ws", 1),
      schemaVersion: PROJECT_HEALTH_SCHEMA_VERSION + 1,
    };
    await memento.update("projectHealth.v1:ws", stale);

    expect(cache.get("ws")).toBeUndefined();
  });

  it("reports a run as due when nothing is stored", () => {
    const cache = new ProjectHealthCache(createMemento(), () => 0);
    expect(cache.isRunDue("ws")).toBe(true);
  });

  it("reports a run as due only after the freshness window elapses", async () => {
    let now = 1_000_000;
    const cache = new ProjectHealthCache(createMemento(), () => now);
    await cache.set(completedReport("ws", now));

    expect(cache.isRunDue("ws")).toBe(false);
    now += 25 * 60 * 60 * 1000;
    expect(cache.isRunDue("ws")).toBe(true);
  });

  it("treats a non-terminal stored run as due", async () => {
    const cache = new ProjectHealthCache(createMemento(), () => 0);
    await cache.set(createInitialReport("ws", "ws", 0));
    expect(cache.isRunDue("ws")).toBe(true);
    expect(cache.lastCompletedAt("ws")).toBeNull();
  });

  it("exposes the last completed timestamp", async () => {
    const cache = new ProjectHealthCache(createMemento(), () => 9999);
    await cache.set(completedReport("ws", 8888));
    expect(cache.lastCompletedAt("ws")).toBe(8888);
  });
});
