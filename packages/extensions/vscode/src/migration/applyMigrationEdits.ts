/**
 * External dependencies.
 */
import * as vscode from "vscode";
import type { MigrationEdit } from "@agentic-web-labs/project-analyzer-core";

export interface ApplyMigrationEditsResult {
  applied: number;
  failed: string[];
}

/**
 * Commits a set of migration edits via `vscode.WorkspaceEdit`. Each edit
 * replaces the entire contents of its file in one step (codemods return
 * the full new source rather than deltas, so a whole-document replace
 * is the safe minimum). The edit is applied through VS Code's normal
 * pipeline, which means the user can undo it with the standard
 * `Ctrl+Z` / `Cmd+Z` shortcut and other editor surfaces (formatters,
 * eslint-on-save, the dirty marker) observe the change.
 *
 * Returns `applied` for the number of edits that landed and `failed`
 * for the file paths that didn't apply (e.g. a file that became
 * read-only between preview and apply). Throws only on a fundamental
 * failure of `applyEdit` itself; per-file failures come back in the
 * result so the caller can surface a partial-success message.
 */
export async function applyMigrationEdits(
  edits: MigrationEdit[],
): Promise<ApplyMigrationEditsResult> {
  if (edits.length === 0) {
    return { applied: 0, failed: [] };
  }

  const workspaceEdit = new vscode.WorkspaceEdit();
  for (const edit of edits) {
    const uri = vscode.Uri.file(edit.file);
    const document = await vscode.workspace.openTextDocument(uri);
    const fullRange = new vscode.Range(
      new vscode.Position(0, 0),
      document.lineAt(document.lineCount - 1).range.end,
    );
    workspaceEdit.replace(uri, fullRange, edit.newText);
  }

  const success = await vscode.workspace.applyEdit(workspaceEdit);
  if (success) {
    return { applied: edits.length, failed: [] };
  }
  return {
    applied: 0,
    failed: edits.map((edit) => edit.file),
  };
}
