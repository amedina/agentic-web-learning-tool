/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Tracks which package.json the npm-advisor side panel should be
 * scoped to. Follows the active editor while it's a package.json,
 * and remembers the last package.json the user focused so opening a
 * non-package file (e.g. a .ts) doesn't blank the panel. Fires
 * onDidChange when the tracked document switches.
 */
export class ActivePackageJsonTracker implements vscode.Disposable {
  private current: vscode.TextDocument | null = null;
  private readonly subscriptions: vscode.Disposable[] = [];
  private readonly emitter = new vscode.EventEmitter<void>();

  readonly onDidChange = this.emitter.event;

  /**
   * Seeds from the currently active editor, then subscribes to
   * editor / document events so the tracker stays in sync as the
   * user navigates around.
   */
  constructor() {
    this.maybeAdoptActiveEditor();
    this.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.maybeAdoptActiveEditor();
      }),
      vscode.workspace.onDidCloseTextDocument((document) => {
        if (
          this.current &&
          this.current.uri.toString() === document.uri.toString()
        ) {
          this.current = null;
          this.emitter.fire();
        }
      }),
    );
  }

  /** Returns the currently tracked package.json document, or null. */
  get document(): vscode.TextDocument | null {
    return this.current;
  }

  /**
   * Promotes the active editor's document to "current" if it's a
   * package.json. When the active editor is something else, leaves
   * the previously remembered package.json in place — the panel
   * stays useful while the user reads other code.
   */
  private maybeAdoptActiveEditor(): void {
    const document = vscode.window.activeTextEditor?.document;
    if (!document || !isPackageJson(document)) {
      return;
    }
    if (this.current?.uri.toString() === document.uri.toString()) {
      return;
    }
    this.current = document;
    this.emitter.fire();
  }

  /** Drops every subscription and the change emitter. */
  dispose(): void {
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }
    this.emitter.dispose();
  }
}

/** True when the document is a workspace package.json file. */
function isPackageJson(document: vscode.TextDocument): boolean {
  if (document.languageId !== "json" && document.languageId !== "jsonc") {
    return false;
  }
  return document.uri.path.endsWith("/package.json");
}
