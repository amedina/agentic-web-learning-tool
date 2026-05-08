/**
 * External dependencies.
 */
import * as vscode from "vscode";
import {
  listSupportedCodemodPackages,
  runMigrationCodemods,
  type MigrationEdit,
} from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { applyMigrationEdits } from "../migration/applyMigrationEdits";

export const RUN_MIGRATION_WIZARD_COMMAND = "npmAdvisor.runMigrationWizard";

/**
 * Registers the project-wide migration wizard. Walks the user through
 * three steps using only native VSCode UI (no custom webview):
 *
 *   1. multi-select QuickPick of replaceable top-level deps for which
 *      a codemod actually exists in module-replacements-codemods,
 *   2. progress notification while previewing, then a side-by-side
 *      diff editor for the first changed file (with a hint that more
 *      files are pending) so the user can sanity-check the rewrite,
 *   3. confirm modal — Apply All / Cancel — that commits the edits
 *      via WorkspaceEdit so they're undoable with Ctrl+Z.
 *
 * Read-only on its own; commit happens only after explicit confirm.
 */
export function registerRunMigrationWizardCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    RUN_MIGRATION_WIZARD_COMMAND,
    async () => {
      const folder = await pickWorkspaceFolder();
      if (!folder) {
        return;
      }
      const candidates = await pickPackagesToMigrate(folder.uri.fsPath);
      if (!candidates) {
        return;
      }

      let edits: MigrationEdit[] = [];
      let unsupported: string[] = [];
      try {
        const result = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "NPM Advisor: previewing migration…",
            cancellable: false,
          },
          () =>
            runMigrationCodemods({
              rootPath: folder.uri.fsPath,
              packageNames: candidates,
            }),
        );
        edits = result.edits;
        unsupported = result.unsupported;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `NPM Advisor: migration preview failed — ${message}`,
        );
        return;
      }

      if (unsupported.length > 0) {
        void vscode.window.showWarningMessage(
          `No codemod available for: ${unsupported.join(", ")}. They were skipped.`,
        );
      }

      if (edits.length === 0) {
        void vscode.window.showInformationMessage(
          "NPM Advisor: nothing to migrate — codemods produced no changes.",
        );
        return;
      }

      await previewFirstEdit(edits);

      const apply = "Apply all";
      const choice = await vscode.window.showInformationMessage(
        buildConfirmPrompt(edits),
        { modal: true },
        apply,
      );
      if (choice !== apply) {
        return;
      }

      try {
        const applyResult = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "NPM Advisor: applying migration…",
            cancellable: false,
          },
          () => applyMigrationEdits(edits),
        );
        if (applyResult.failed.length > 0) {
          void vscode.window.showWarningMessage(
            `NPM Advisor: applied ${applyResult.applied} edit${applyResult.applied === 1 ? "" : "s"}, but ${applyResult.failed.length} failed.`,
          );
          return;
        }
        void vscode.window.showInformationMessage(
          `NPM Advisor: migration applied to ${applyResult.applied} file${applyResult.applied === 1 ? "" : "s"}. Save the editor when you're happy. Use Ctrl+Z to undo.`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `NPM Advisor: applying migration failed — ${message}`,
        );
      }
    },
  );
}

/**
 * Step 0: pick the workspace folder to migrate. Mirrors the resolver
 * used by the project-analysis command — single folder is auto-picked,
 * multiple folders go through a QuickPick.
 */
async function pickWorkspaceFolder(): Promise<
  vscode.WorkspaceFolder | undefined
> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length === 0) {
    void vscode.window.showInformationMessage(
      "NPM Advisor: open a folder first — migration runs against a workspace folder.",
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
    { placeHolder: "Pick a workspace folder to migrate", ignoreFocusOut: true },
  );
  return picked?.folder;
}

/**
 * Step 1: present a multi-select QuickPick of every top-level
 * dependency that (a) has a codemod in the catalog and (b) actually
 * appears in the project's package.json. Returns the picked package
 * names, or `undefined` when the user dismisses the prompt.
 */
async function pickPackagesToMigrate(
  rootPath: string,
): Promise<string[] | undefined> {
  let intersection: string[] = [];
  try {
    const supported = new Set(listSupportedCodemodPackages());
    const projectDeps = await readTopLevelDependencyNames(rootPath);
    intersection = projectDeps.filter((name) => supported.has(name)).sort();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(
      `NPM Advisor: could not read package.json — ${message}`,
    );
    return undefined;
  }

  if (intersection.length === 0) {
    void vscode.window.showInformationMessage(
      "NPM Advisor: no codemod-eligible dependencies found. Nothing to migrate.",
    );
    return undefined;
  }

  const picked = await vscode.window.showQuickPick(
    intersection.map((name) => ({
      label: name,
      description: "codemod available",
      picked: true,
    })),
    {
      canPickMany: true,
      placeHolder:
        "Select dependencies to migrate (codemods will rewrite source files)",
      ignoreFocusOut: true,
    },
  );
  if (!picked || picked.length === 0) {
    return undefined;
  }
  return picked.map((entry) => entry.label);
}

/**
 * Reads the project's package.json and returns every package name
 * declared in `dependencies`, `devDependencies`, or `peerDependencies`.
 */
async function readTopLevelDependencyNames(
  rootPath: string,
): Promise<string[]> {
  const uri = vscode.Uri.file(`${rootPath}/package.json`);
  const document = await vscode.workspace.openTextDocument(uri);
  const parsed = JSON.parse(document.getText()) as Record<string, unknown>;
  const buckets = ["dependencies", "devDependencies", "peerDependencies"];
  const names = new Set<string>();
  for (const bucket of buckets) {
    const block = parsed[bucket];
    if (!block || typeof block !== "object") {
      continue;
    }
    for (const name of Object.keys(block as Record<string, unknown>)) {
      names.add(name);
    }
  }
  return [...names];
}

/**
 * Step 2 (preview): opens the first edit in a diff editor so the user
 * can read the kind of changes the migration will make. Diffing every
 * file would flood the editor; one is enough to build trust before the
 * confirm modal lists the rest.
 */
async function previewFirstEdit(edits: MigrationEdit[]): Promise<void> {
  const first = edits[0];
  const baseUri = vscode.Uri.file(first.file);
  const proposedUri = baseUri.with({
    scheme: "untitled",
    path: `${baseUri.path}.proposed`,
  });
  // Untitled docs are easiest to seed by opening with a string content
  // option. VSCode's openTextDocument({ content }) creates an untitled
  // doc pre-populated with the proposed text — perfect for a diff.
  const proposedDocument = await vscode.workspace.openTextDocument({
    language: languageIdFor(first.file),
    content: first.newText,
  });
  await vscode.commands.executeCommand(
    "vscode.diff",
    baseUri,
    proposedDocument.uri,
    `Migration preview: ${baseFilename(first.file)} (proposed)`,
    { preview: true },
  );
  // Silences an unused-binding warning while keeping the with-derived
  // URI in scope for future per-file preview iterations.
  void proposedUri;
}

/**
 * Builds the confirm modal's prompt text — names every file the
 * migration would change so the user can sanity-check the scope before
 * authorizing the WorkspaceEdit.
 */
function buildConfirmPrompt(edits: MigrationEdit[]): string {
  const lines = [
    `Apply migration to ${edits.length} file${edits.length === 1 ? "" : "s"}?`,
    "",
    ...edits.slice(0, 8).map((edit) => `• ${edit.file}`),
  ];
  if (edits.length > 8) {
    lines.push(`…and ${edits.length - 8} more.`);
  }
  lines.push("");
  lines.push("Changes are undoable with Ctrl+Z.");
  return lines.join("\n");
}

/** Returns the trailing path component of an absolute file path. */
function baseFilename(file: string): string {
  const parts = file.split(/[\\/]/);
  return parts[parts.length - 1] ?? file;
}

/**
 * Picks a coarse VSCode language id for a source file based on its
 * extension, so the diff preview gets correct syntax highlighting.
 */
function languageIdFor(file: string): string {
  if (file.endsWith(".tsx")) {
    return "typescriptreact";
  }
  if (file.endsWith(".ts") || file.endsWith(".cts") || file.endsWith(".mts")) {
    return "typescript";
  }
  if (file.endsWith(".jsx")) {
    return "javascriptreact";
  }
  return "javascript";
}
