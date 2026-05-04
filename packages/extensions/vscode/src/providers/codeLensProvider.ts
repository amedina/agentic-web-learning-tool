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

export class PackageJsonCodeLensProvider implements vscode.CodeLensProvider {
  private readonly cache: StatsCache;
  private readonly settingsProvider: () => NpmAdvisorSettings;
  private readonly emitter = new vscode.EventEmitter<void>();
  private readonly disposables: vscode.Disposable[] = [];

  readonly onDidChangeCodeLenses = this.emitter.event;

  constructor(cache: StatsCache, settingsProvider: () => NpmAdvisorSettings) {
    this.cache = cache;
    this.settingsProvider = settingsProvider;
    this.disposables.push(this.cache.onDidChange(() => this.emitter.fire()));
  }

  /**
   * Force VSCode to re-resolve all visible CodeLenses. Used when a
   * setting that affects badge contents changes.
   */
  refresh(): void {
    this.emitter.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    return parseDependencies(document).map((dependency) => {
      const lens = new vscode.CodeLens(
        dependency.nameRange,
      ) as DependencyCodeLens;
      lens.dependency = dependency;
      return lens;
    });
  }

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

  dispose(): void {
    this.emitter.dispose();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
