/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";
import { formatBadge } from "../codeLens/format";
import type { NpmAdvisorSettings } from "../diagnostics/settings";
import {
  parseDependencies,
  type PackageJsonDependency,
} from "../packageJson/parse";

interface DependencyCodeLens extends vscode.CodeLens {
  dependency: PackageJsonDependency;
}

/**
 * Two-phase CodeLens provider scoped to package.json files.
 * provideCodeLenses returns a placeholder lens per dependency
 * synchronously so VSCode can render their gutter positions instantly;
 * resolveCodeLens then awaits the StatsCache and attaches the formatted
 * badge as the lens command title.
 */
export class PackageJsonCodeLensProvider implements vscode.CodeLensProvider {
  private readonly cache: StatsCache;
  private readonly settingsProvider: () => NpmAdvisorSettings;
  private readonly emitter = new vscode.EventEmitter<void>();
  private readonly disposables: vscode.Disposable[] = [];

  readonly onDidChangeCodeLenses = this.emitter.event;

  /**
   * Wires the provider to its cache and settings reader, and subscribes
   * to cache.onDidChange so SWR refreshes re-fire the CodeLens-changed
   * event automatically.
   */
  constructor(cache: StatsCache, settingsProvider: () => NpmAdvisorSettings) {
    this.cache = cache;
    this.settingsProvider = settingsProvider;
    this.disposables.push(this.cache.onDidChange(() => this.emitter.fire()));
  }

  /**
   * Forces VSCode to re-resolve all visible CodeLenses. Used when a
   * setting that affects badge contents changes (e.g. targetLicense).
   */
  refresh(): void {
    this.emitter.fire();
  }

  /**
   * Phase one of the CodeLens contract: returns a placeholder lens per
   * dependency in the document. No network or cache work happens here
   * so the gutter renders instantly.
   */
  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    return parseDependencies(document).map((dependency) => {
      const lens = new vscode.CodeLens(
        dependency.nameRange,
      ) as DependencyCodeLens;
      lens.dependency = dependency;
      return lens;
    });
  }

  /**
   * Phase two: looks up stats through the cache, formats the badge,
   * and attaches the click command. Returns undefined to suppress the
   * lens when stats are unavailable or formatBadge produces nothing.
   */
  async resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken,
  ): Promise<vscode.CodeLens | undefined> {
    const dependencyLens = codeLens as DependencyCodeLens;
    const { dependency } = dependencyLens;
    const stats = await this.cache.get(dependency.name, dependency.version);
    if (token.isCancellationRequested || !stats) {
      return undefined;
    }
    const settings = this.settingsProvider();
    const title = formatBadge(stats, {
      targetLicense: settings.targetLicense,
    });
    if (!title) {
      return undefined;
    }
    dependencyLens.command = {
      title,
      command: "npmAdvisor.viewPackage",
      arguments: [dependency.name],
    };
    return dependencyLens;
  }

  /**
   * Releases the changed-event emitter and any cache subscriptions.
   * Wired to context.subscriptions so VSCode calls this on extension
   * deactivation.
   */
  dispose(): void {
    this.emitter.dispose();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
