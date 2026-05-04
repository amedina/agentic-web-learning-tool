/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { GithubAuthService } from "../services/githubAuthService";

export const SIGN_IN_GITHUB_COMMAND = "npmAdvisor.signInToGitHub";
export const SIGN_OUT_GITHUB_COMMAND = "npmAdvisor.signOutFromGitHub";

/**
 * Registers the "Sign in to GitHub" command. On success a confirmation
 * notification is shown; the auth service's onDidChange (fired by signIn
 * itself) is what triggers the cache clear and the webview refresh.
 */
export function registerSignInToGithubCommand(
  service: GithubAuthService,
): vscode.Disposable {
  return vscode.commands.registerCommand(SIGN_IN_GITHUB_COMMAND, async () => {
    const success = await service.signIn();
    if (success) {
      void vscode.window.showInformationMessage(
        "NPM Advisor: Signed in to GitHub. Package data will refresh shortly.",
      );
    }
  });
}

/**
 * Registers the "Sign out from GitHub" command. VSCode does not expose
 * a programmatic sign-out for the GitHub provider, so this drops our
 * cached session reference and points the user at the Accounts gear
 * menu for the actual revoke.
 */
export function registerSignOutFromGithubCommand(
  service: GithubAuthService,
): vscode.Disposable {
  return vscode.commands.registerCommand(SIGN_OUT_GITHUB_COMMAND, () => {
    const had = service.signOut();
    if (had) {
      void vscode.window.showInformationMessage(
        "NPM Advisor: Disconnected from GitHub. To fully revoke the session, use the VSCode Accounts menu in the lower-left.",
      );
    } else {
      void vscode.window.showInformationMessage(
        "NPM Advisor: No active GitHub session to disconnect.",
      );
    }
  });
}
