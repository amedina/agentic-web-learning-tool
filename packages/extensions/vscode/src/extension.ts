/**
 * External dependencies.
 */
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
import { DiagnosticsRunner } from "./diagnostics/runner";
import { readSettings } from "./diagnostics/settings";
import { PackageJsonCodeLensProvider } from "./providers/codeLensProvider";
import { PackageJsonHoverProvider } from "./providers/hoverProvider";
import {
  NpmAdvisorWebviewProvider,
  WEBVIEW_VIEW_ID,
} from "./providers/webviewViewProvider";
import { GithubAuthService } from "./services/githubAuthService";
import { RecentProjectsTracker } from "./services/recentProjectsTracker";
import { WebviewBridge } from "./webview/bridge";
import { ActivePackageJsonTracker } from "./workspace/activePackageJsonTracker";
import { PackageJsonScanner } from "./workspace/packageJsonScanner";

const PACKAGE_JSON_SELECTOR: vscode.DocumentFilter[] = [
  { language: "json", pattern: "**/package.json" },
  { language: "jsonc", pattern: "**/package.json" },
];

/**
 * Extension entry point. VSCode invokes this once after the extension's
 * activation event fires (workspaceContains:**\/package.json). Wires up
 * the StatsCache, registers hover / CodeLens / diagnostics / webview
 * providers, registers commands, and binds workspace event listeners.
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
    fetcher: (name) =>
      getPackageStats(name, readSettings().targetLicense, {
        includeDependencyTree: false,
      }),
    options: { ttlMs: ONE_DAY_MS, failureTtlMs: ONE_DAY_MS },
  });
  context.subscriptions.push(cache);

  const projectAnalysisCollection = vscode.languages.createDiagnosticCollection(
    "npm-advisor-project",
  );
  context.subscriptions.push(projectAnalysisCollection);

  const bridge = new WebviewBridge({
    cache,
    settingsProvider: readSettings,
    githubAuth,
    projectAnalysisCollection,
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

  const hoverProvider = new PackageJsonHoverProvider(cache, readSettings);
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

  const codeLensProvider = new PackageJsonCodeLensProvider(cache, readSettings);
  context.subscriptions.push(codeLensProvider);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      PACKAGE_JSON_SELECTOR,
      codeLensProvider,
    ),
  );

  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("npm-advisor");
  context.subscriptions.push(diagnosticCollection);

  context.subscriptions.push(
    registerRunProjectAnalysisCommand({
      collection: projectAnalysisCollection,
    }),
    registerClearProjectAnalysisCommand({
      collection: projectAnalysisCollection,
    }),
    registerRunMigrationWizardCommand(),
  );

  const runner = new DiagnosticsRunner({
    cache,
    collection: diagnosticCollection,
    settingsProvider: readSettings,
  });

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
      }
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      runner.clear(event.document);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("npmAdvisor")) {
        return;
      }
      codeLensProvider.refresh();
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
