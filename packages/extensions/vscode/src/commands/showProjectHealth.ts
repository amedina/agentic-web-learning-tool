/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { NpmAdvisorWebviewProvider } from "../providers/webviewViewProvider";

export const SHOW_PROJECT_HEALTH_DEPENDENCIES_COMMAND =
  "npmAdvisor.showProjectHealthDependencies";

/**
 * Registers the command that reveals the npm-advisor side panel and
 * switches it to the workspace-wide Project Health view's Dependencies
 * sub-tab. Invoked from the "Show Project Health" action on the daily
 * summary notification so the panel lands on the dependency check rather
 * than wherever it was last left. Not contributed to the command palette
 * — it is an internal navigation helper, not a user-facing command.
 */
export function registerShowProjectHealthDependenciesCommand(
  provider: NpmAdvisorWebviewProvider,
): vscode.Disposable {
  return vscode.commands.registerCommand(
    SHOW_PROJECT_HEALTH_DEPENDENCIES_COMMAND,
    async () => {
      await provider.revealProjectHealthDependencies();
    },
  );
}
