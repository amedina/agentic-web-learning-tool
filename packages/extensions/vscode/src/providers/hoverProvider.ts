/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";
import { renderHover } from "../hover/render";
import { parseDependencies } from "../packageJson/parse";
import type { NpmAdvisorSettings } from "../diagnostics/settings";

/**
 * External dependencies.
 */
import * as vscode from "vscode";

export class PackageJsonHoverProvider implements vscode.HoverProvider {
  private readonly cache: StatsCache;
  private readonly settingsProvider: () => NpmAdvisorSettings;

  constructor(cache: StatsCache, settingsProvider: () => NpmAdvisorSettings) {
    this.cache = cache;
    this.settingsProvider = settingsProvider;
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.Hover | undefined> {
    const dependency = parseDependencies(document).find((entry) =>
      entry.fullRange.contains(position),
    );
    if (!dependency) {
      return undefined;
    }

    const stats = await this.cache.get(dependency.name, dependency.version);
    if (token.isCancellationRequested || !stats) {
      return undefined;
    }

    const settings = this.settingsProvider();
    const markdown = new vscode.MarkdownString(
      renderHover(stats, { targetLicense: settings.targetLicense }),
    );
    markdown.isTrusted = true;
    markdown.supportHtml = false;
    return new vscode.Hover(markdown, dependency.fullRange);
  }
}
