/**
 * External dependencies.
 */
import * as path from "node:path";
import * as vscode from "vscode";
import {
  configureGithubAuth,
  getPackageStats,
} from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { StatsCache } from "./cache/statsCache";
import { registerChatParticipant } from "./chat/participant";
import { registerClearCacheCommand } from "./commands/clearCache";
import {
  registerSignInToGithubCommand,
  registerSignOutFromGithubCommand,
} from "./commands/githubAuth";
import { registerRunMigrationWizardCommand } from "./commands/runMigrationWizard";
import {
  registerClearProjectAnalysisCommand,
  registerRunProjectAnalysisCommand,
} from "./commands/runProjectAnalysis";
import { registerSetupMcpCommand } from "./commands/setupMcp";
import { registerShowInsightsCommand } from "./commands/showInsights";
import { registerUninstallMcpCommand } from "./commands/uninstallMcp";
import { registerViewPackageCommand } from "./commands/viewPackage";
import { ProjectAnalysisCache } from "./diagnostics/projectAnalysisCache";
import { DiagnosticsRunner } from "./diagnostics/runner";
import { readSettings } from "./diagnostics/settings";
import { PackageJsonHoverProvider } from "./providers/hoverProvider";
import {
  NpmAdvisorWebviewProvider,
  WEBVIEW_VIEW_ID,
} from "./providers/webviewViewProvider";
import { GithubAuthService } from "./services/githubAuthService";
import { RecentProjectsTracker } from "./services/recentProjectsTracker";
import { WebviewBridge } from "./webview/bridge";
import { ActivePackageJsonTracker } from "./workspace/activePackageJsonTracker";
import { LockfileResolver } from "./workspace/lockfileResolver";
import { PackageJsonScanner } from "./workspace/packageJsonScanner";

const PACKAGE_JSON_SELECTOR: vscode.DocumentFilter[] = [
  { language: "json", pattern: "**/package.json" },
  { language: "jsonc", pattern: "**/package.json" },
];

/**
 * Extension entry point. VSCode invokes this once after the extension's
 * activation event fires (workspaceContains:**\/package.json). Wires up
 * the StatsCache, registers hover / diagnostics / webview providers,
 * registers commands, and binds workspace event listeners.
 */
export function activate(context: vscode.ExtensionContext): void {
  const githubAuth = new GithubAuthService();
  context.subscriptions.push(githubAuth);

  // Records every workspace folder VSCode opens into a small
  // shared registry file that the npm-advisor MCP server reads —
  // gives Claude Desktop / Cursor / Claude Code a way to discover
  // which projects the user actually has in flight when they ask
  // about "their project".
  context.subscriptions.push(new RecentProjectsTracker());
  // Lifts analyzer-core's githubFetch from the 60-req/hr unauthenticated
  // limit to 5 000-req/hr by attaching the user's VSCode-managed
  // GitHub session token (when available) on every API call.
  configureGithubAuth({ getToken: () => githubAuth.getToken() });

  // Day-long TTL: cached entries are returned synchronously while
  // fresh, and on a stale hit the cache returns the stale value
  // immediately and kicks off a background refresh (stale-while-
  // revalidate) so the next read sees updated data without ever
  // blocking the UI on the network. The Refresh button in the side
  // panel (npmAdvisor.clearCache) still busts entries on demand.
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const cache = new StatsCache({
    storage: context.globalState,
    fetcher: (name, version) => {
      // The cache key is either a resolved semver (when callers looked
      // up the installed version from a lockfile) or a non-semver
      // sentinel like "*" / a package.json range. We only pass it down
      // as `resolvedVersion` when it's clean semver; otherwise let
      // analyzer-core fall back to `dist-tags.latest`.
      const resolvedVersion = isCleanSemver(version) ? version : undefined;
      return getPackageStats(name, readSettings().targetLicense, {
        includeDependencyTree: false,
        resolvedVersion,
      });
    },
    options: { ttlMs: ONE_DAY_MS, failureTtlMs: ONE_DAY_MS },
  });
  context.subscriptions.push(cache);

  const lockfileResolver = new LockfileResolver();
  context.subscriptions.push(lockfileResolver);

  const projectAnalysisCollection = vscode.languages.createDiagnosticCollection(
    "npm-advisor-project",
  );
  context.subscriptions.push(projectAnalysisCollection);

  const projectAnalysisCache = new ProjectAnalysisCache();

  const bridge = new WebviewBridge({
    cache,
    settingsProvider: readSettings,
    githubAuth,
    projectAnalysisCollection,
    projectAnalysisCache,
  });
  context.subscriptions.push(bridge);

  const scanner = new PackageJsonScanner();
  context.subscriptions.push(scanner);

  const tracker = new ActivePackageJsonTracker();
  context.subscriptions.push(tracker);

  const webviewProvider = new NpmAdvisorWebviewProvider({
    context,
    bridge,
    tracker,
    scanner,
    cache,
  });
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WEBVIEW_VIEW_ID, webviewProvider),
  );

  context.subscriptions.push(
    tracker.onDidChange(() => webviewProvider.refresh()),
    scanner.onDidChange(() => webviewProvider.refresh()),
  );

  const hoverProvider = new PackageJsonHoverProvider(
    cache,
    readSettings,
    lockfileResolver,
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      PACKAGE_JSON_SELECTOR,
      hoverProvider,
    ),
  );

  context.subscriptions.push(registerViewPackageCommand());
  context.subscriptions.push(registerClearCacheCommand(cache));
  context.subscriptions.push(registerShowInsightsCommand(webviewProvider));
  context.subscriptions.push(registerSignInToGithubCommand(githubAuth));
  context.subscriptions.push(registerSignOutFromGithubCommand(githubAuth));
  context.subscriptions.push(
    registerSetupMcpCommand({ extensionUri: context.extensionUri }),
  );
  context.subscriptions.push(
    registerUninstallMcpCommand({ extensionUri: context.extensionUri }),
  );
  context.subscriptions.push(
    registerChatParticipant({
      cache,
      tracker,
      extensionUri: context.extensionUri,
    }),
  );

  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("npm-advisor");
  context.subscriptions.push(diagnosticCollection);

  context.subscriptions.push(
    registerRunProjectAnalysisCommand({
      collection: projectAnalysisCollection,
      cache: projectAnalysisCache,
    }),
    registerClearProjectAnalysisCommand({
      collection: projectAnalysisCollection,
      cache: projectAnalysisCache,
    }),
    registerRunMigrationWizardCommand(),
  );

  const runner = new DiagnosticsRunner({
    cache,
    collection: diagnosticCollection,
    settingsProvider: readSettings,
    lockfileResolver,
  });
  context.subscriptions.push(runner);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      void runner.refresh(document);
      if (isPackageJsonDocument(document)) {
        webviewProvider.refresh();
      }
    }),
    vscode.workspace.onDidSaveTextDocument((document) => {
      void runner.refresh(document);
      if (isPackageJsonDocument(document)) {
        webviewProvider.refresh();
        // A saved package.json invalidates any cached project analysis
        // rooted at the same folder: publint reads from package.json
        // directly, and findReplacementOpportunities walks its
        // dependency blocks. Drop the cache entry and tell the
        // webview its last result is now stale so the user sees a
        // "Re-run analysis" prompt instead of phantom-correct data.
        const rootPath = projectRootForPackageJson(document.uri);
        if (rootPath) {
          projectAnalysisCache.invalidate(rootPath);
          webviewProvider.notifyProjectAnalysisStale(document.uri);
        }
      }
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      // Debounced: a single keystroke used to call runner.clear()
      // synchronously, blanking the Problems panel until the next save
      // refreshed it. scheduleClear coalesces a burst of edits into one
      // clear after the user stops typing, so squiggles no longer
      // flicker mid-edit.
      runner.scheduleClear(event.document);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("npmAdvisor")) {
        return;
      }
      void runner.refreshOpenPackageJsons();
    }),
    cache.onDidChange((change) => {
      void runner.refreshOpenPackageJsons();
      if (change.name === "*" && change.version === "*") {
        webviewProvider.forceRefresh();
      }
    }),
    // Sign-in / sign-out should retry every previously rate-limited
    // request: clearAll fires the sentinel onDidChange, which the
    // listener above already turns into a webview forceRefresh.
    githubAuth.onDidChange(() => {
      void cache.clearAll();
    }),
    // A changed lockfile means previously cached resolutions are stale.
    // Refresh diagnostics and the side panel so the new install state
    // shows up without the user having to clear the cache.
    lockfileResolver.onDidChange(() => {
      void runner.refreshOpenPackageJsons();
      webviewProvider.forceRefresh();
    }),
  );

  // Seed diagnostics for any package.json the user already has open.
  void runner.refreshOpenPackageJsons();
}

/**
 * Extension teardown hook. All disposables (cache, providers, command
 * registrations, event listeners) are tracked on
 * context.subscriptions, so VSCode disposes them automatically and
 * this function has nothing extra to do.
 */
export function deactivate(): void {}

/** True when the document is a workspace package.json. */
function isPackageJsonDocument(document: vscode.TextDocument): boolean {
  if (document.languageId !== "json" && document.languageId !== "jsonc") {
    return false;
  }
  return document.uri.path.endsWith("/package.json");
}

/**
 * Test whether a string is a clean semver version (e.g. `4.17.20`) — not
 * a range like `^4.17.0`, a wildcard, a tag like `latest`, or a sentinel
 * like the webview's `*`. Only clean semver flows into analyzer-core's
 * `resolvedVersion` option; everything else triggers the latest fallback.
 */
function isCleanSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(?:[-+][\w.+-]+)?$/.test(version);
}

/**
 * Returns the absolute path of the project root that owns the given
 * package.json URI — the directory immediately containing it. Mirrors
 * the convention the analyzer / runner already use (root = parent of
 * package.json) so cache keys stay consistent across producers and
 * consumers.
 */
function projectRootForPackageJson(uri: vscode.Uri): string | null {
  const fsPath = uri.fsPath;
  if (!fsPath.endsWith("package.json")) {
    return null;
  }
  return path.dirname(fsPath);
}
