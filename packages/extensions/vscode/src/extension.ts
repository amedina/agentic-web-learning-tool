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
import { registerShowInsightsCommand } from "./commands/showInsights";
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
  // Lifts analyzer-core's githubFetch from the 60-req/hr unauthenticated
  // limit to 5 000-req/hr by attaching the user's VSCode-managed
  // GitHub session token (when available) on every API call.
  configureGithubAuth({ getToken: () => githubAuth.getToken() });

  // Hard cache: a year-long TTL effectively turns off the
  // stale-while-revalidate background refresh so cached entries are
  // returned forever without firing follow-up network calls. The
  // Refresh button in the side panel is the only way to bust them
  // (npmAdvisor.clearCache); a new dep added to package.json fetches
  // because there's nothing cached for that name yet.
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const cache = new StatsCache({
    storage: context.globalState,
    fetcher: (name) =>
      getPackageStats(name, readSettings().targetLicense, {
        includeDependencyTree: false,
      }),
    options: { ttlMs: ONE_YEAR_MS, failureTtlMs: ONE_YEAR_MS },
  });
  context.subscriptions.push(cache);

  const bridge = new WebviewBridge({
    cache,
    settingsProvider: readSettings,
    githubAuth,
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
