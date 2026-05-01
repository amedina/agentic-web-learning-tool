import * as vscode from "vscode";

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
}

export function deactivate(): void {}
