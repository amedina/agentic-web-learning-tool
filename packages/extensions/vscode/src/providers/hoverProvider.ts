/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";
import { renderHover, renderLocalPackageHover } from "../hover/render";
import { parseDependencies } from "../packageJson/parse";
import { classifyLocalPackageSpec } from "../packageJson/localSpec";
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

    // Local packages (workspace:/file:/link:/portal:) are never on the
    // registry, so resolve them to a static note up front rather than
    // firing a doomed fetch — that fetch is what leaves VSCode showing a
    // flickering "Loading…" before the hover vanishes.
    const localKind = classifyLocalPackageSpec(dependency.version);
    if (localKind) {
      return this.toHover(
        renderLocalPackageHover(dependency.name, dependency.version, localKind),
        dependency.fullRange,
      );
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
    return this.toHover(
      renderHover(stats, {
        targetLicense: settings.targetLicense,
        declaredRange: dependency.version,
        installedVersion,
      }),
      dependency.fullRange,
    );
  }

  /**
   * Wraps rendered hover markdown in a trusted, theme-icon-enabled
   * MarkdownString and Hover scoped to the dependency's range. Trust is
   * required for the `command:` link in the full-stats hover; theme icons
   * render the leading `$(extensions-view-icon)` brand glyph.
   */
  private toHover(markdownText: string, range: vscode.Range): vscode.Hover {
    const markdown = new vscode.MarkdownString(markdownText);
    markdown.isTrusted = true;
    markdown.supportHtml = false;
    markdown.supportThemeIcons = true;
    return new vscode.Hover(markdown, range);
  }
}
