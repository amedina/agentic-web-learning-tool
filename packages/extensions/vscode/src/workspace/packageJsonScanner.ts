/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { PackageJsonFile } from "../webview/protocol";

/**
 * Directories whose package.json files should never surface in the
 * workspace switcher: dependency / build output dirs and hidden tool
 * config dirs such as `.claude` (which can hold its own package.json
 * for plugins and is not a real workspace package).
 */
export const EXCLUDE_GLOB =
  "**/{node_modules,dist,build,.git,.next,out,.claude}/**";

/**
 * Discovers every package.json in the open workspace folders and
 * exposes them as PackageJsonFile records (uri + relative path +
 * parsed `name` field). Results are cached and invalidated by a
 * FileSystemWatcher so create / delete / save events update the
 * available-files list without manual refreshes. Fires onDidChange
 * after each invalidation so subscribers (the webview) can re-render.
 */
export class PackageJsonScanner implements vscode.Disposable {
  private cached: Promise<PackageJsonFile[]> | null = null;
  private readonly watcher: vscode.FileSystemWatcher;
  private readonly emitter = new vscode.EventEmitter<void>();

  readonly onDidChange = this.emitter.event;

  /**
   * Wires up a FileSystemWatcher for every package.json in the
   * workspace. Save events trigger invalidation too because the
   * `name` field may have changed.
   */
  constructor() {
    this.watcher = vscode.workspace.createFileSystemWatcher("**/package.json");
    this.watcher.onDidCreate(() => this.invalidate());
    this.watcher.onDidDelete(() => this.invalidate());
    this.watcher.onDidChange(() => this.invalidate());
  }

  /**
   * Returns the current list of package.json files in the workspace,
   * sorted by relative path. Fetched once and cached until the watcher
   * fires; subsequent calls before invalidation share the same Promise.
   */
  async list(): Promise<PackageJsonFile[]> {
    if (!this.cached) {
      this.cached = this.scan();
    }
    return this.cached;
  }

  /** Drops the cache and notifies subscribers that the list may have changed. */
  invalidate(): void {
    this.cached = null;
    this.emitter.fire();
  }

  /**
   * Performs the actual workspace scan: globs for every package.json
   * outside common build / dependency directories, reads each one,
   * and parses out the `name` field. Read failures are tolerated —
   * the file still appears in the list, just without a name label.
   */
  private async scan(): Promise<PackageJsonFile[]> {
    const uris = await vscode.workspace.findFiles(
      "**/package.json",
      EXCLUDE_GLOB,
    );
    const records = await Promise.all(
      uris.map(async (uri) => ({
        uri: uri.toString(),
        relativePath: vscode.workspace.asRelativePath(uri, true),
        name: await readPackageName(uri),
      })),
    );
    records.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return records;
  }

  /** Releases the watcher and the change emitter. */
  dispose(): void {
    this.watcher.dispose();
    this.emitter.dispose();
  }
}

/**
 * Reads a package.json's `name` field. Tolerates malformed JSON,
 * missing files, and absent `name` fields by returning null — the
 * UI then falls back to displaying just the relative path.
 */
async function readPackageName(uri: vscode.Uri): Promise<string | null> {
  try {
    const buffer = await vscode.workspace.fs.readFile(uri);
    const text = new TextDecoder().decode(buffer);
    const parsed = JSON.parse(text) as { name?: unknown };
    return typeof parsed.name === "string" ? parsed.name : null;
  } catch {
    return null;
  }
}
