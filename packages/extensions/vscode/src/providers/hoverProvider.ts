/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";
import { renderHover } from "../hover/render";
import { parseDependencies } from "../packageJson/parse";
import type { NpmAdvisorSettings } from "../diagnostics/settings";

/**
 * Hover provider scoped to package.json files. Resolves the dependency
 * under the cursor via the parser, fetches stats through the cache,
 * and renders a markdown popover with the package's score, bundle,
 * advisories, license, and links.
 */
export class PackageJsonHoverProvider implements vscode.HoverProvider {
  private readonly cache: StatsCache;
  private readonly settingsProvider: () => NpmAdvisorSettings;

  /** Wires the provider to its cache and settings reader. */
  constructor(cache: StatsCache, settingsProvider: () => NpmAdvisorSettings) {
    this.cache = cache;
    this.settingsProvider = settingsProvider;
  }

  /**
   * VSCode's HoverProvider entry point. Returns undefined when the
   * cursor isn't on a dependency line, the cache has no data, or the
   * hover request was cancelled while waiting on the network.
   */
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
    markdown.supportThemeIcons = true;
    return new vscode.Hover(markdown, dependency.fullRange);
  }
}
