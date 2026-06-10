/**
 * External dependencies.
 */
import type * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { SuppressionPredicates } from "./projectHealthReport";
import {
  buildSuppressionPredicates,
  suppressionKey,
} from "./suppressionMatching";
import type { MuteTarget, SuppressionEntry } from "./types";

/** workspaceState key holding the suppression list. */
const STORAGE_KEY = "projectHealth.suppressions.v1";

/**
 * Persists the user's muted findings in workspaceState, so a suppression
 * is scoped to the project it was accepted in (an issue muted in project
 * A never silences the same issue in project B). Provides the predicates
 * the totals calculation uses to exclude muted findings.
 */
export class SuppressionStore {
  private readonly storage: vscode.Memento;

  /** Wires the store to a workspace-scoped Memento. */
  constructor(storage: vscode.Memento) {
    this.storage = storage;
  }

  /** Returns every persisted suppression entry. */
  list(): SuppressionEntry[] {
    return this.storage.get<SuppressionEntry[]>(STORAGE_KEY, []);
  }

  /**
   * Adds a suppression, replacing any existing entry with the same key
   * (so re-muting refreshes the reason/timestamp rather than duplicating).
   */
  async add(entry: SuppressionEntry): Promise<void> {
    const key = suppressionKey(entry);
    const next = this.list().filter(
      (existing) => suppressionKey(existing) !== key,
    );
    next.push(entry);
    await this.storage.update(STORAGE_KEY, next);
  }

  /** Removes the suppression matching the given target, if present. */
  async remove(target: MuteTarget): Promise<void> {
    const key = suppressionKey(target);
    const next = this.list().filter(
      (existing) => suppressionKey(existing) !== key,
    );
    await this.storage.update(STORAGE_KEY, next);
  }

  /** Builds the suppression predicates from the current entries. */
  predicates(): SuppressionPredicates {
    return buildSuppressionPredicates(this.list());
  }
}
