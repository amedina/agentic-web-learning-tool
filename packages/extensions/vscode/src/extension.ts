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
import {
  maybePromptToConfigureHover,
  registerConfigureHoverCommand,
} from "./commands/configureHover";
import { registerViewPackageCommand } from "./commands/viewPackage";
import { DiagnosticsRunner } from "./diagnostics/runner";
import { readSettings } from "./diagnostics/settings";
import { PackageJsonCodeLensProvider } from "./providers/codeLensProvider";
import { PackageJsonHoverProvider } from "./providers/hoverProvider";

const PACKAGE_JSON_SELECTOR: vscode.DocumentFilter[] = [
  { language: "json", pattern: "**/package.json" },
  { language: "jsonc", pattern: "**/package.json" },
];

/**
 * Tree provider that contributes no children, so the npm-advisor view
 * always renders its viewsWelcome content. Will be replaced when Tier 2
 * lands a real report tree.
 */
class WelcomeTreeProvider implements vscode.TreeDataProvider<never> {
  /** Required by TreeDataProvider; never invoked because there are no children. */
  getTreeItem(element: never): vscode.TreeItem {
    return element;
  }

  /** Always returns an empty list to keep the welcome view active. */
  getChildren(): vscode.ProviderResult<never[]> {
    return [];
  }
}

/**
 * Extension entry point. VSCode invokes this once after the extension's
 * activation event fires (workspaceContains:**\/package.json). Wires up
 * the StatsCache, registers hover / CodeLens / diagnostics providers,
 * registers commands, and binds workspace event listeners.
 */
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
  context.subscriptions.push(registerConfigureHoverCommand());

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

  // First-run prompt to silence VSCode's diagnostic-in-hover so the
  // hover renders as a single block. No-op after the user has answered.
  void maybePromptToConfigureHover(context);
}

/**
 * Extension teardown hook. All disposables (cache, providers, command
 * registrations, event listeners) are tracked on
 * context.subscriptions, so VSCode disposes them automatically and
 * this function has nothing extra to do.
 */
export function deactivate(): void {}
