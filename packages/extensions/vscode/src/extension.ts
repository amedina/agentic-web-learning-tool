/**
 * Internal dependencies.
 */
import { StatsCache } from "./cache/statsCache";
import { PackageJsonHoverProvider } from "./providers/hoverProvider";

/**
 * External dependencies.
 */
import * as vscode from "vscode";
import { getPackageStats } from "@agentic-web-labs/package-analyzer-core";

const PACKAGE_JSON_SELECTOR: vscode.DocumentFilter[] = [
  { language: "json", pattern: "**/package.json" },
  { language: "jsonc", pattern: "**/package.json" },
];

const TARGET_LICENSE = "MIT";

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
      getPackageStats(name, TARGET_LICENSE, { includeDependencyTree: false }),
  });
  context.subscriptions.push(cache);

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      PACKAGE_JSON_SELECTOR,
      new PackageJsonHoverProvider(cache, { targetLicense: TARGET_LICENSE }),
    ),
  );
}

export function deactivate(): void {}
