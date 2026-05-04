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

export interface DiagnosticsRunnerDeps {
  cache: StatsCache;
  collection: vscode.DiagnosticCollection;
  settingsProvider: () => NpmAdvisorSettings;
}

/**
 * Owns the npm-advisor DiagnosticCollection and re-evaluates diagnostic
 * rules per package.json on demand. Wired by extension.activate to
 * onDidOpen / onDidSave / onDidChangeConfiguration / cache.onDidChange
 * events.
 */
export class DiagnosticsRunner {
  private readonly cache: StatsCache;
  private readonly collection: vscode.DiagnosticCollection;
  private readonly settingsProvider: () => NpmAdvisorSettings;

  /**
   * Stores the cache, target collection, and settings reader the
   * runner will use on every refresh.
   */
  constructor(deps: DiagnosticsRunnerDeps) {
    this.cache = deps.cache;
    this.collection = deps.collection;
    this.settingsProvider = deps.settingsProvider;
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
    const dependencies = parseDependencies(document);
    if (dependencies.length === 0) {
      this.collection.set(document.uri, []);
      return;
    }
    const settings = this.settingsProvider();
    const diagnostics: vscode.Diagnostic[] = [];
    const results = await Promise.all(
      dependencies.map(async (dependency) => {
        const stats = await this.cache.get(dependency.name, dependency.version);
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
    this.collection.delete(document.uri);
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
}

/** True if the given text document is a package.json file. */
function isPackageJson(document: vscode.TextDocument): boolean {
  if (document.languageId !== "json" && document.languageId !== "jsonc") {
    return false;
  }
  return document.uri.path.endsWith("/package.json");
}
