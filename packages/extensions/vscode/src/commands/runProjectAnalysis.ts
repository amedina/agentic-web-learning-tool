/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { ProjectAnalysisCache } from "../diagnostics/projectAnalysisCache";
import {
  clearProjectAnalysis,
  runProjectAnalysis,
} from "../diagnostics/projectAnalysisRunner";

export const RUN_PROJECT_ANALYSIS_COMMAND = "npmAdvisor.runProjectAnalysis";
export const CLEAR_PROJECT_ANALYSIS_COMMAND = "npmAdvisor.clearProjectAnalysis";

export interface RegisterRunProjectAnalysisCommandDeps {
  collection: vscode.DiagnosticCollection;
  /**
   * Shared result cache. The command-driven run writes to it on
   * success and the companion clear-command invalidates the entry for
   * every workspace root the user has analyzed so the webview tab
   * also resets when diagnostics are dismissed.
   */
  cache: ProjectAnalysisCache;
}

/**
 * Registers the manual "Run project analysis" command. Resolves the
 * target workspace folder (single → use it; multiple → quick-pick),
 * shows a progress notification while publint + replacements run, and
 * writes the results to the project-analysis diagnostic collection.
 */
export function registerRunProjectAnalysisCommand(
  deps: RegisterRunProjectAnalysisCommandDeps,
): vscode.Disposable {
  return vscode.commands.registerCommand(
    RUN_PROJECT_ANALYSIS_COMMAND,
    async () => {
      const folder = await pickWorkspaceFolder();
      if (!folder) {
        return;
      }
      try {
        const result = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "NPM Advisor: analyzing project…",
            cancellable: false,
          },
          () =>
            runProjectAnalysis(deps.collection, {
              rootPath: folder.uri.fsPath,
              cache: deps.cache,
            }),
        );
        await reportResult(result.analysis.findings.length, folder.name);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `NPM Advisor: project analysis failed — ${message}`,
        );
      }
    },
  );
}

/**
 * Registers a small companion command that wipes every diagnostic the
 * project-analysis runner has written. Surfaces the same DiagnosticCollection
 * the run command populates so the two stay paired.
 */
export function registerClearProjectAnalysisCommand(
  deps: RegisterRunProjectAnalysisCommandDeps,
): vscode.Disposable {
  return vscode.commands.registerCommand(CLEAR_PROJECT_ANALYSIS_COMMAND, () => {
    clearProjectAnalysis(deps.collection);
    deps.cache.clear();
    void vscode.window.showInformationMessage(
      "NPM Advisor: cleared project-analysis diagnostics.",
    );
  });
}

/**
 * Resolves the workspace folder to analyze. Picks the only folder when
 * there is one, prompts via QuickPick when there are several, and shows
 * an information message when none are open.
 */
async function pickWorkspaceFolder(): Promise<
  vscode.WorkspaceFolder | undefined
> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length === 0) {
    void vscode.window.showInformationMessage(
      "NPM Advisor: open a folder first — project analysis runs against a workspace folder.",
    );
    return undefined;
  }
  if (folders.length === 1) {
    return folders[0];
  }
  const picked = await vscode.window.showQuickPick(
    folders.map((folder) => ({
      label: folder.name,
      description: folder.uri.fsPath,
      folder,
    })),
    {
      placeHolder: "Pick a workspace folder to analyze",
      ignoreFocusOut: true,
    },
  );
  return picked?.folder;
}

/**
 * Shows a follow-up notification summarising what the run produced and,
 * when there are findings, offers a one-click jump to the Problems panel.
 */
async function reportResult(
  findingsCount: number,
  folderName: string,
): Promise<void> {
  if (findingsCount === 0) {
    void vscode.window.showInformationMessage(
      `NPM Advisor: no project-level issues found in ${folderName}.`,
    );
    return;
  }
  const open = "Open Problems";
  const choice = await vscode.window.showInformationMessage(
    `NPM Advisor: found ${findingsCount} project-level finding${findingsCount === 1 ? "" : "s"} in ${folderName}.`,
    open,
  );
  if (choice === open) {
    void vscode.commands.executeCommand("workbench.actions.view.problems");
  }
}
