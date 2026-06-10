/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import type * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { SuppressionStore } from "../suppressionStore";

/** In-memory Memento satisfying the store's contract. */
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

describe("SuppressionStore", () => {
  it("adds, lists, and removes entries", async () => {
    const store = new SuppressionStore(createMemento());
    await store.add({
      kind: "vuln",
      packageName: "lodash",
      id: "GHSA-1",
      mutedAt: 1,
    });
    expect(store.list()).toHaveLength(1);

    await store.remove({ kind: "vuln", packageName: "lodash", id: "GHSA-1" });
    expect(store.list()).toHaveLength(0);
  });

  it("replaces an entry with the same key instead of duplicating", async () => {
    const store = new SuppressionStore(createMemento());
    await store.add({
      kind: "license",
      packageName: "gpl-pkg",
      mutedAt: 1,
    });
    await store.add({
      kind: "license",
      packageName: "gpl-pkg",
      reason: "accepted",
      mutedAt: 2,
    });

    const entries = store.list();
    expect(entries).toHaveLength(1);
    expect(entries[0].reason).toBe("accepted");
  });

  it("exposes predicates derived from the stored entries", async () => {
    const store = new SuppressionStore(createMemento());
    await store.add({
      kind: "vuln",
      packageName: "lodash",
      id: "GHSA-1",
      mutedAt: 1,
    });
    const predicates = store.predicates();
    expect(
      predicates.isVulnerabilitySuppressed?.({
        packageName: "lodash",
        version: "1.0.0",
        severity: "high",
        summary: "x",
        url: "u",
        id: "GHSA-1",
      }),
    ).toBe(true);
  });
});
