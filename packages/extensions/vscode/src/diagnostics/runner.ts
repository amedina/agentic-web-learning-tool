/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";
import { parseDependencies } from "../packageJson/parse";
import { evaluateDiagnostics } from "./rules";
import type { NpmAdvisorSettings } from "./settings";
import type { LockfileResolver } from "../workspace/lockfileResolver";

export interface DiagnosticsRunnerDeps {
  cache: StatsCache;
  collection: vscode.DiagnosticCollection;
  settingsProvider: () => NpmAdvisorSettings;
  lockfileResolver: LockfileResolver;
  /**
   * Override for `setTimeout` / `clearTimeout`. Lets tests pin time to
   * a fake-timer harness without depending on global vi state.
   */
  scheduler?: {
    setTimeout: (handler: () => void, ms: number) => unknown;
    clearTimeout: (handle: unknown) => void;
  };
}

/**
 * Delay applied to the debounced clear triggered by
 * `onDidChangeTextDocument`. Long enough that a typing burst doesn't
 * flicker the Problems panel, short enough that a real pause still
 * clears stale squiggles before the next save lands.
 */
const CLEAR_DEBOUNCE_MS = 750;

/**
 * Owns the npm-advisor DiagnosticCollection and re-evaluates diagnostic
 * rules per package.json on demand. Wired by extension.activate to
 * onDidOpen / onDidSave / onDidChangeConfiguration / cache.onDidChange
 * events.
 */
export class DiagnosticsRunner implements vscode.Disposable {
  private readonly cache: StatsCache;
  private readonly collection: vscode.DiagnosticCollection;
  private readonly settingsProvider: () => NpmAdvisorSettings;
  private readonly lockfileResolver: LockfileResolver;
  private readonly scheduler: NonNullable<DiagnosticsRunnerDeps["scheduler"]>;
  private readonly pendingClears = new Map<string, unknown>();

  /**
   * Stores the cache, target collection, settings reader, and lockfile
   * resolver the runner will use on every refresh. The lockfile resolver
   * supplies the installed version per dep so the cache key (and the
   * underlying stats fetch) matches what the user actually has on disk.
   */
  constructor(deps: DiagnosticsRunnerDeps) {
    this.cache = deps.cache;
    this.collection = deps.collection;
    this.settingsProvider = deps.settingsProvider;
    this.lockfileResolver = deps.lockfileResolver;
    this.scheduler = deps.scheduler ?? {
      setTimeout: (handler, ms) => setTimeout(handler, ms),
      clearTimeout: (handle) =>
        clearTimeout(handle as Parameters<typeof clearTimeout>[0]),
    };
  }

  /**
   * Re-evaluates rules for one package.json document and writes the
   * resulting diagnostics to the collection. No-ops for non-package.json
   * documents. Deps whose stats haven't been fetched yet are silently
   * skipped — they'll appear once cache.onDidChange triggers a refresh.
   */
  async refresh(document: vscode.TextDocument): Promise<void> {
    if (!isPackageJson(document)) {
      return;
    }
    this.cancelPendingClear(document.uri);
    const dependencies = parseDependencies(document);
    if (dependencies.length === 0) {
      this.collection.set(document.uri, []);
      return;
    }
    const settings = this.settingsProvider();
    const diagnostics: vscode.Diagnostic[] = [];
    const results = await Promise.all(
      dependencies.map(async (dependency) => {
        const installedVersion = await this.lockfileResolver.resolveVersion(
          document.uri,
          dependency.name,
        );
        const cacheVersion = installedVersion ?? dependency.version;
        const stats = await this.cache.get(dependency.name, cacheVersion);
        return { dependency, stats };
      }),
    );
    for (const { dependency, stats } of results) {
      if (!stats) {
        continue;
      }
      diagnostics.push(...evaluateDiagnostics(dependency, stats, settings));
    }
    this.collection.set(document.uri, diagnostics);
  }

  /**
   * Drops diagnostics for a package.json document — used during edits
   * so stale line ranges don't lag the user's typing. Re-added on next
   * save via refresh().
   */
  clear(document: vscode.TextDocument): void {
    if (!isPackageJson(document)) {
      return;
    }
    this.cancelPendingClear(document.uri);
    this.collection.delete(document.uri);
  }

  /**
   * Debounced clear. Used by `onDidChangeTextDocument` so a single
   * keystroke doesn't flicker the Problems panel; only a sustained
   * pause (no further edits for {@link CLEAR_DEBOUNCE_MS} ms) drops
   * the stale diagnostics. Re-scheduling restarts the timer so a
   * burst of edits coalesces into one clear at the end.
   */
  scheduleClear(document: vscode.TextDocument): void {
    if (!isPackageJson(document)) {
      return;
    }
    const key = document.uri.toString();
    const existing = this.pendingClears.get(key);
    if (existing !== undefined) {
      this.scheduler.clearTimeout(existing);
    }
    const handle = this.scheduler.setTimeout(() => {
      this.pendingClears.delete(key);
      this.collection.delete(document.uri);
    }, CLEAR_DEBOUNCE_MS);
    this.pendingClears.set(key, handle);
  }

  /**
   * Cancel a pending debounced clear for one URI. Used when a real
   * `refresh` lands before the debounce window elapses so we don't
   * blank the collection right after writing into it.
   */
  private cancelPendingClear(uri: vscode.Uri): void {
    const key = uri.toString();
    const handle = this.pendingClears.get(key);
    if (handle !== undefined) {
      this.scheduler.clearTimeout(handle);
      this.pendingClears.delete(key);
    }
  }

  /**
   * Refreshes diagnostics for every package.json the editor currently
   * has open. Used at activation and after settings or cache changes.
   */
  async refreshOpenPackageJsons(): Promise<void> {
    await Promise.all(
      vscode.workspace.textDocuments
        .filter(isPackageJson)
        .map((document) => this.refresh(document)),
    );
  }

  /**
   * Cancel every pending debounced clear. Called when the extension
   * deactivates so a fired timer can't write into an already-disposed
   * DiagnosticCollection.
   */
  dispose(): void {
    for (const handle of this.pendingClears.values()) {
      this.scheduler.clearTimeout(handle);
    }
    this.pendingClears.clear();
  }
}

/** True if the given text document is a package.json file. */
function isPackageJson(document: vscode.TextDocument): boolean {
  if (document.languageId !== "json" && document.languageId !== "jsonc") {
    return false;
  }
  return document.uri.path.endsWith("/package.json");
}
