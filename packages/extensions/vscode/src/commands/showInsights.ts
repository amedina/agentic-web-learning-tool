/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { NpmAdvisorWebviewProvider } from "../providers/webviewViewProvider";

export const SHOW_INSIGHTS_COMMAND = "npmAdvisor.showInsights";

/**
 * Registers the "Show full insights" command. Reveals the npm-advisor
 * side panel and asks the webview to scroll to and expand the named
 * package's accordion row. Invoked from the package.json hover popover
 * via a `command:` markdown link.
 */
export function registerShowInsightsCommand(
  provider: NpmAdvisorWebviewProvider,
): vscode.Disposable {
  return vscode.commands.registerCommand(
    SHOW_INSIGHTS_COMMAND,
    async (packageName: unknown) => {
      if (!packageName || typeof packageName !== "string") {
        return;
      }
      await provider.focusPackage(packageName);
    },
  );
}
