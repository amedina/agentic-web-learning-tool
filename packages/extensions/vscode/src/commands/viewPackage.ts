/**
 * External dependencies.
 */
import * as vscode from "vscode";

export const VIEW_PACKAGE_COMMAND = "npmAdvisor.viewPackage";

/**
 * Opens the npm package page for the given dependency in the user's
 * default browser. Will be replaced with the in-editor report webview
 * when Tier 2 lands.
 */
export function registerViewPackageCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    VIEW_PACKAGE_COMMAND,
    async (packageName: string) => {
      if (!packageName || typeof packageName !== "string") {
        return;
      }
      const url = `https://www.npmjs.com/package/${encodeURIComponent(packageName)}`;
      await vscode.env.openExternal(vscode.Uri.parse(url));
    },
  );
}
