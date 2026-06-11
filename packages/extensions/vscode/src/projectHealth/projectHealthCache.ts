/**
 * External dependencies.
 */
import type * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import {
  PROJECT_HEALTH_SCHEMA_VERSION,
  isTerminalPhase,
  type ProjectHealthReport,
} from "./types";

/**
 * Namespace prefix for every Project Health entry in globalState. The
 * trailing `v1:` mirrors the schema version, so bumping
 * {@link PROJECT_HEALTH_SCHEMA_VERSION} and this prefix together drops
 * every stored report without a migration.
 */
const STORAGE_KEY_PREFIX = "projectHealth.v1:";

/** Default freshness window for "is a new run due?" (24 hours). */
const DEFAULT_DUE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Persists the most recent Project Health report per workspace into
 * globalState so it survives editor restarts. Unlike the per-project
 * analysis cache, this is durable on disk because the report is the
 * basis for daily-freshness decisions and for diffing new issues against
 * the last run when notifying the user.
 */
export class ProjectHealthCache {
  private readonly storage: vscode.Memento;
  private readonly clock: () => number;

  /** Wires the cache to globalState and an optional injectable clock. */
  constructor(storage: vscode.Memento, clock: () => number = Date.now) {
    this.storage = storage;
    this.clock = clock;
  }

  /**
   * Returns the stored report for a workspace, or undefined when none is
   * stored or the stored schema version no longer matches (treated as a
   * miss so a stale shape never reaches the UI).
   */
  get(workspaceKey: string): ProjectHealthReport | undefined {
    const entry = this.storage.get<ProjectHealthReport>(makeKey(workspaceKey));
    if (!entry || entry.schemaVersion !== PROJECT_HEALTH_SCHEMA_VERSION) {
      return undefined;
    }
    return entry;
  }

  /** Persists the latest report snapshot for a workspace. */
  async set(report: ProjectHealthReport): Promise<void> {
    await this.storage.update(makeKey(report.workspaceKey), report);
  }

  /** Removes the stored report for one workspace. */
  async invalidate(workspaceKey: string): Promise<void> {
    await this.storage.update(makeKey(workspaceKey), undefined);
  }

  /**
   * True when a fresh run is due for the workspace: either nothing has
   * been stored, the last run never reached a terminal phase, or the last
   * completed run finished more than `dueAfterMs` ago. Used by the
   * scheduler to decide whether to auto-run on activation.
   */
  isRunDue(
    workspaceKey: string,
    dueAfterMs: number = DEFAULT_DUE_AFTER_MS,
  ): boolean {
    const entry = this.get(workspaceKey);
    if (!entry || !isTerminalPhase(entry.phase)) {
      return true;
    }
    return this.clock() - entry.generatedAt >= dueAfterMs;
  }

  /**
   * Returns the timestamp of the last completed (terminal-phase) run for
   * the workspace, or null when there has never been one. Surfaced in the
   * UI as "Last run …".
   */
  lastCompletedAt(workspaceKey: string): number | null {
    const entry = this.get(workspaceKey);
    if (!entry || !isTerminalPhase(entry.phase)) {
      return null;
    }
    return entry.generatedAt;
  }
}

/** Builds the globalState key for a workspace's report. */
function makeKey(workspaceKey: string): string {
  return `${STORAGE_KEY_PREFIX}${workspaceKey}`;
}
