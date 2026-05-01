/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";
import { renderHover } from "../hover/render";
import { parseDependencies } from "../packageJson/parse";

/**
 * External dependencies.
 */
import * as vscode from "vscode";

export interface PackageJsonHoverProviderOptions {
  targetLicense: string;
}

export class PackageJsonHoverProvider implements vscode.HoverProvider {
  private readonly cache: StatsCache;
  private readonly options: PackageJsonHoverProviderOptions;

  constructor(cache: StatsCache, options: PackageJsonHoverProviderOptions) {
    this.cache = cache;
    this.options = options;
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

    const markdown = new vscode.MarkdownString(
      renderHover(stats, { targetLicense: this.options.targetLicense }),
    );
    markdown.isTrusted = true;
    markdown.supportHtml = false;
    return new vscode.Hover(markdown, dependency.fullRange);
  }
}
