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
import type { LockfileResolver } from "../workspace/lockfileResolver";

/**
 * Hover provider scoped to package.json files. Resolves the dependency
 * under the cursor via the parser, looks up the installed version in
 * the nearest lockfile, fetches stats through the cache (keyed by the
 * resolved version), and renders a markdown popover with the package's
 * score, bundle, advisories, license, and links.
 */
export class PackageJsonHoverProvider implements vscode.HoverProvider {
  private readonly cache: StatsCache;
  private readonly settingsProvider: () => NpmAdvisorSettings;
  private readonly lockfileResolver: LockfileResolver;

  /**
   * Wires the provider to its cache, settings reader, and lockfile
   * resolver. The lockfile resolver supplies the installed version so
   * advisory matching and the hover badge can reflect what the user
   * actually has on disk.
   */
  constructor(
    cache: StatsCache,
    settingsProvider: () => NpmAdvisorSettings,
    lockfileResolver: LockfileResolver,
  ) {
    this.cache = cache;
    this.settingsProvider = settingsProvider;
    this.lockfileResolver = lockfileResolver;
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

    const installedVersion = await this.lockfileResolver.resolveVersion(
      document.uri,
      dependency.name,
    );
    const cacheVersion = installedVersion ?? dependency.version;
    const stats = await this.cache.get(dependency.name, cacheVersion);
    if (token.isCancellationRequested || !stats) {
      return undefined;
    }

    const settings = this.settingsProvider();
    const markdown = new vscode.MarkdownString(
      renderHover(stats, {
        targetLicense: settings.targetLicense,
        declaredRange: dependency.version,
        installedVersion,
      }),
    );
    markdown.isTrusted = true;
    markdown.supportHtml = false;
    markdown.supportThemeIcons = true;
    return new vscode.Hover(markdown, dependency.fullRange);
  }
}
