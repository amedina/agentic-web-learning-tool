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

export class DiagnosticsRunner {
  private readonly cache: StatsCache;
  private readonly collection: vscode.DiagnosticCollection;
  private readonly settingsProvider: () => NpmAdvisorSettings;

  constructor(deps: DiagnosticsRunnerDeps) {
    this.cache = deps.cache;
    this.collection = deps.collection;
    this.settingsProvider = deps.settingsProvider;
  }

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

  clear(document: vscode.TextDocument): void {
    if (!isPackageJson(document)) {
      return;
    }
    this.collection.delete(document.uri);
  }

  async refreshOpenPackageJsons(): Promise<void> {
    await Promise.all(
      vscode.workspace.textDocuments
        .filter(isPackageJson)
        .map((document) => this.refresh(document)),
    );
  }
}

function isPackageJson(document: vscode.TextDocument): boolean {
  if (document.languageId !== "json" && document.languageId !== "jsonc") {
    return false;
  }
  return document.uri.path.endsWith("/package.json");
}
