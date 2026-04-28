/**
 * External dependencies.
 */
import * as vscode from "vscode";

export class StatusBarManager implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.item.command = "npmAdvisor.refresh";
  }

  showAnalyzing(): void {
    this.item.text = "$(loading~spin) NPM Advisor";
    this.item.tooltip = "NPM Advisor: Analysing dependencies…";
    this.item.backgroundColor = undefined;
    this.item.show();
  }

  showResults(total: number, issueCount: number): void {
    if (issueCount > 0) {
      this.item.text = `$(warning) NPM Advisor: ${issueCount} issue${issueCount === 1 ? "" : "s"}`;
      this.item.tooltip = `NPM Advisor: ${issueCount} issue${issueCount === 1 ? "" : "s"} found across ${total} packages. Click to refresh.`;
      this.item.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground",
      );
    } else {
      this.item.text = `$(check) NPM Advisor: ${total} package${total === 1 ? "" : "s"}`;
      this.item.tooltip = `NPM Advisor: ${total} package${total === 1 ? "" : "s"} analysed. Click to refresh.`;
      this.item.backgroundColor = undefined;
    }
    this.item.show();
  }

  showIdle(): void {
    this.item.hide();
  }

  dispose(): void {
    this.item.dispose();
  }
}
