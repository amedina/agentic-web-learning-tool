/**
 * External dependencies.
 */
import * as vscode from "vscode";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Internal dependencies.
 */
import {
  readRegistry,
  recordAllProjectsClosed,
  recordProjectClosed,
  recordProjectOpened,
  writeRegistry,
} from "./recentProjectsRegistry";

/**
 * Watches VSCode's workspace folders and keeps the shared
 * recent-projects registry in sync. The registry is the bridge that
 * lets MCP clients (Claude Desktop, Cursor, Claude Code) know which
 * projects the user has opened in VSCode without us shipping IPC.
 *
 * On construction we record every currently-open folder; on dispose
 * we mark them closed so a clean exit doesn't leave stale "open"
 * entries. We also subscribe to onDidChangeWorkspaceFolders so adding
 * or removing a folder mid-session updates the registry too.
 */
export class RecentProjectsTracker implements vscode.Disposable {
  private readonly subscriptions: vscode.Disposable[] = [];
  private readonly trackedAbsolutePaths = new Set<string>();

  /** Records every currently-open folder and starts watching for changes. */
  constructor() {
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      this.recordOpened(folder.uri.fsPath);
    }
    this.subscriptions.push(
      vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        for (const added of event.added) {
          this.recordOpened(added.uri.fsPath);
        }
        for (const removed of event.removed) {
          this.recordClosed(removed.uri.fsPath);
        }
      }),
    );
  }

  /**
   * Marks a folder as currently open in the shared registry, parsing
   * the project's name out of the root package.json when present.
   * Tolerates a missing or malformed package.json — those projects
   * still show up in the registry, just with `name: null`.
   */
  private recordOpened(absolutePath: string): void {
    if (this.trackedAbsolutePaths.has(absolutePath)) {
      return;
    }
    this.trackedAbsolutePaths.add(absolutePath);
    const name = readRootPackageJsonName(absolutePath);
    const next = recordProjectOpened(readRegistry(), {
      absolutePath,
      name,
    });
    safeWriteRegistry(next);
  }

  /** Marks a folder as no longer open without deleting the entry. */
  private recordClosed(absolutePath: string): void {
    this.trackedAbsolutePaths.delete(absolutePath);
    const next = recordProjectClosed(readRegistry(), absolutePath);
    safeWriteRegistry(next);
  }

  /**
   * Drops every subscription and marks every folder we tracked as
   * closed. Called when the extension deactivates so a clean exit
   * leaves the registry in a consistent "no VSCode windows open"
   * state.
   */
  dispose(): void {
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }
    if (this.trackedAbsolutePaths.size === 0) {
      return;
    }
    const closed = recordAllProjectsClosed(readRegistry());
    safeWriteRegistry(closed);
    this.trackedAbsolutePaths.clear();
  }
}

/**
 * Reads `name` from the workspace root's package.json without using
 * jsonc-parser — this runs at activate time before any vscode parser
 * is wired up, so we keep it dependency-free. Returns null on missing
 * file, malformed JSON, or absent name field.
 */
function readRootPackageJsonName(absolutePath: string): string | null {
  const candidate = join(absolutePath, "package.json");
  if (!existsSync(candidate)) {
    return null;
  }
  try {
    const text = readFileSync(candidate, "utf8");
    const parsed = JSON.parse(text) as { name?: unknown };
    return typeof parsed.name === "string" ? parsed.name : null;
  } catch {
    return null;
  }
}

/**
 * Best-effort registry write: file-system errors get swallowed so a
 * crash here can never cascade into a failed extension activation.
 * The registry is context for AI clients; missing entries are just
 * a degraded experience, not a broken extension.
 */
function safeWriteRegistry(projects: ReturnType<typeof readRegistry>): void {
  try {
    writeRegistry(projects);
  } catch {
    // Swallow — see JSDoc.
  }
}
