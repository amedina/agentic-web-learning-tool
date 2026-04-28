/**
 * External dependencies.
 */
import * as vscode from "vscode";
import { configureGithubAuth } from "@google-awlt/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { StatusBarManager } from "./statusBar";
import { NpmAdvisorHoverProvider } from "./providers/hoverProvider";
import { DiagnosticsProvider } from "./providers/diagnosticsProvider";
import { NpmAdvisorTreeDataProvider } from "./providers/treeDataProvider";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  configureGithubAuth({ getToken: () => getGithubToken(context) });

  const statusBar = new StatusBarManager();
  const treeDataProvider = new NpmAdvisorTreeDataProvider();
  const diagnosticsProvider = new DiagnosticsProvider(statusBar);

  const treeView = vscode.window.createTreeView("npmAdvisorDependencies", {
    treeDataProvider,
    showCollapseAll: true,
  });

  context.subscriptions.push(
    statusBar,
    treeDataProvider,
    diagnosticsProvider,
    treeView,

    vscode.languages.registerHoverProvider(
      { language: "json", pattern: "**/package.json" },
      new NpmAdvisorHoverProvider(),
    ),

    vscode.commands.registerCommand("npmAdvisor.refresh", async () => {
      await Promise.all([
        treeDataProvider.refresh(),
        refreshDiagnosticsForOpenEditors(diagnosticsProvider),
      ]);
    }),

    vscode.commands.registerCommand(
      "npmAdvisor.openOnNpm",
      (packageName: string) => {
        void vscode.env.openExternal(
          vscode.Uri.parse(`https://www.npmjs.com/package/${packageName}`),
        );
      },
    ),
  );

  diagnosticsProvider.register();
  await treeDataProvider.loadFromWorkspace();
}

export function deactivate(): void {
  // VS Code disposes all context.subscriptions automatically.
}

async function getGithubToken(
  context: vscode.ExtensionContext,
): Promise<string | null> {
  // Prefer an explicit token from settings over the OAuth session.
  const config = vscode.workspace.getConfiguration("npmAdvisor");
  const manualToken = config.get<string>("githubToken");
  if (manualToken && manualToken.trim()) {
    return manualToken.trim();
  }

  // Fall back to VS Code's built-in GitHub auth (silent — no prompt).
  try {
    const session = await vscode.authentication.getSession(
      "github",
      ["read:user"],
      { silent: true, createIfNone: false },
    );
    if (session) {
      return session.accessToken;
    }
  } catch {
    // Auth provider not available — fine, fall through to unauthenticated.
  }

  void context; // context held for potential future secrets API use
  return null;
}

async function refreshDiagnosticsForOpenEditors(
  provider: DiagnosticsProvider,
): Promise<void> {
  await Promise.all(
    vscode.workspace.textDocuments
      .filter(
        (doc) =>
          doc.fileName.endsWith("package.json") &&
          !doc.fileName.includes("node_modules"),
      )
      .map((doc) => provider.analyseUri(doc.uri)),
  );
}
