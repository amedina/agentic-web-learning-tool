/**
 * External dependencies.
 */
import * as vscode from "vscode";

export const CONFIGURE_HOVER_COMMAND = "npmAdvisor.configureHover";

/** Key used in globalState to remember whether we've already prompted the user. */
const PROMPTED_KEY = "npmAdvisor.promptedToConfigureHover";

/**
 * Registers the command that turns off VSCode's auto-rendering of
 * diagnostics inside hover popovers. With this off, NPM Advisor's
 * hover renders as a single block — the only source for the warnings
 * is then our hover content (and the Problems panel + wavy underlines).
 */
export function registerConfigureHoverCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(CONFIGURE_HOVER_COMMAND, async () => {
    await disableHoverDiagnostics();
    void vscode.window.showInformationMessage(
      "NPM Advisor: editor.hover.showDiagnostics turned off. Hovers now render as a single block. Re-enable in Settings any time.",
    );
  });
}

/**
 * On first activation, offers to disable VSCode's diagnostic-in-hover
 * rendering so NPM Advisor's hover shows as a single block. Skips the
 * prompt if the user has already been asked, has already disabled the
 * setting themselves, or rejected once before.
 */
export async function maybePromptToConfigureHover(
  context: vscode.ExtensionContext,
): Promise<void> {
  if (context.globalState.get<boolean>(PROMPTED_KEY, false)) {
    return;
  }
  const config = vscode.workspace.getConfiguration("editor.hover");
  const current = config.get<boolean>("showDiagnostics", true);
  if (current === false) {
    await context.globalState.update(PROMPTED_KEY, true);
    return;
  }
  const choice = await vscode.window.showInformationMessage(
    "NPM Advisor shows dependency warnings inside its hover. VSCode also auto-renders the same warnings as separate hover sections above it. Disable that for a single-block hover?",
    "Disable",
    "Keep as-is",
  );
  await context.globalState.update(PROMPTED_KEY, true);
  if (choice === "Disable") {
    await disableHoverDiagnostics();
  }
}

/** Sets editor.hover.showDiagnostics to false at the user (global) level. */
async function disableHoverDiagnostics(): Promise<void> {
  const config = vscode.workspace.getConfiguration("editor.hover");
  await config.update(
    "showDiagnostics",
    false,
    vscode.ConfigurationTarget.Global,
  );
}
