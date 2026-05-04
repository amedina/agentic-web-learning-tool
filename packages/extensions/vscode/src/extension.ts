/**
 * External dependencies.
 */
import * as vscode from "vscode";
import { getPackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { StatsCache } from "./cache/statsCache";
import { registerClearCacheCommand } from "./commands/clearCache";
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
  const cache = new StatsCache({
    storage: context.globalState,
    fetcher: (name) =>
      getPackageStats(name, readSettings().targetLicense, {
        includeDependencyTree: false,
      }),
  });
  context.subscriptions.push(cache);

  const bridge = new WebviewBridge({
    cache,
    settingsProvider: readSettings,
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
    cache.onDidChange(() => {
      void runner.refreshOpenPackageJsons();
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
