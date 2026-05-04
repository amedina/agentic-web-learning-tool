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
import { registerViewPackageCommand } from "./commands/viewPackage";
import { DiagnosticsRunner } from "./diagnostics/runner";
import { readSettings } from "./diagnostics/settings";
import { PackageJsonCodeLensProvider } from "./providers/codeLensProvider";
import { PackageJsonHoverProvider } from "./providers/hoverProvider";

const PACKAGE_JSON_SELECTOR: vscode.DocumentFilter[] = [
  { language: "json", pattern: "**/package.json" },
  { language: "jsonc", pattern: "**/package.json" },
];

class WelcomeTreeProvider implements vscode.TreeDataProvider<never> {
  getTreeItem(element: never): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.ProviderResult<never[]> {
    return [];
  }
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "npmAdvisor.welcome",
      new WelcomeTreeProvider(),
    ),
  );

  const cache = new StatsCache({
    storage: context.globalState,
    fetcher: (name) =>
      getPackageStats(name, readSettings().targetLicense, {
        includeDependencyTree: false,
      }),
  });
  context.subscriptions.push(cache);

  const hoverProvider = new PackageJsonHoverProvider(cache, readSettings);
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      PACKAGE_JSON_SELECTOR,
      hoverProvider,
    ),
  );

  context.subscriptions.push(registerViewPackageCommand());
  context.subscriptions.push(registerClearCacheCommand(cache));

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
    }),
    vscode.workspace.onDidSaveTextDocument((document) => {
      void runner.refresh(document);
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

export function deactivate(): void {}
