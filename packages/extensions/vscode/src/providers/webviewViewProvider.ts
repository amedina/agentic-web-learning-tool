/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { parseDependencies } from "../packageJson/parse";
import type { WebviewBridge } from "../webview/bridge";
import type { PackageJsonDependenciesPayload } from "../webview/protocol";

export const WEBVIEW_VIEW_ID = "npmAdvisor.welcome";

interface NpmAdvisorWebviewProviderDeps {
  context: vscode.ExtensionContext;
  bridge: WebviewBridge;
}

/**
 * Hosts the React analyzer-ui inside the npm-advisor activity-bar
 * view. Builds the webview HTML, wires its postMessage channel to
 * WebviewBridge, and re-sends the package.json snapshot whenever the
 * user opens or saves a package.json so the UI stays in sync.
 */
export class NpmAdvisorWebviewProvider implements vscode.WebviewViewProvider {
  private readonly context: vscode.ExtensionContext;
  private readonly bridge: WebviewBridge;
  private webviewView: vscode.WebviewView | null = null;
  private pendingFocusPackageName: string | null = null;

  /** Stores the extension context (for asset URIs) and the bridge. */
  constructor(deps: NpmAdvisorWebviewProviderDeps) {
    this.context = deps.context;
    this.bridge = deps.bridge;
  }

  /**
   * VSCode invokes this once when the view becomes visible. We
   * configure CSP / asset roots, render the HTML shell, attach the
   * bridge's postMessage handler, and seed the initial deps payload.
   */
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "dist"),
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };
    webviewView.webview.html = this.renderHtml(webviewView.webview);
    this.bridge.attach(webviewView.webview);
    this.sendInitMessage(this.pendingFocusPackageName ?? undefined);
    this.pendingFocusPackageName = null;
  }

  /**
   * Re-runs the package.json discovery and pushes a fresh `init`
   * payload to the webview. Called by extension.activate on workspace
   * events so the UI reflects edits without a manual refresh.
   */
  refresh(): void {
    if (this.webviewView) {
      this.sendInitMessage();
    }
  }

  /**
   * Reveals the npm-advisor side panel and asks the webview to scroll
   * to the named package. If the webview hasn't mounted yet (cold
   * start), the focus name is queued and applied once init fires.
   */
  async focusPackage(packageName: string): Promise<void> {
    await vscode.commands.executeCommand(`${WEBVIEW_VIEW_ID}.focus`);
    if (this.webviewView) {
      this.bridge.post({ type: "focusPackage", packageName });
    } else {
      this.pendingFocusPackageName = packageName;
    }
  }

  /**
   * Reads the first package.json open in the workspace, extracts its
   * three dependency lists, and posts them as the init payload. When
   * no package.json is open, sends empty arrays so the UI shows its
   * "no dependencies" state instead of hanging on the loader.
   */
  private sendInitMessage(focusPackageName?: string): void {
    const payload = collectPackageJsonDependencies();
    this.bridge.post({
      type: "init",
      packageJsonDependencies: payload,
      focusPackageName,
    });
  }

  /**
   * Returns the HTML shell for the webview: a strict CSP, references
   * to the bundled webview.js / webview.css under the extension's
   * dist folder via asWebviewUri, and a single `<div id="root">` for
   * React to mount into.
   */
  private renderHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.css"),
    );
    const nonce = generateNonce();
    const cspSource = webview.cspSource;
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${cspSource};"
    />
    <link rel="stylesheet" href="${styleUri}" />
    <title>NPM Advisor</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

/**
 * Discovers package.json dependencies from the editor's open documents
 * and returns the three arrays the analyzer-ui expects. When more than
 * one package.json is open, the first one wins — picking the "active"
 * package.json is a Tier 2 follow-up.
 */
function collectPackageJsonDependencies(): PackageJsonDependenciesPayload {
  const empty: PackageJsonDependenciesPayload = {
    dependencies: [],
    devDependencies: [],
    peerDependencies: [],
  };
  const document = vscode.workspace.textDocuments.find(
    (candidate) =>
      candidate.uri.path.endsWith("/package.json") &&
      (candidate.languageId === "json" || candidate.languageId === "jsonc"),
  );
  if (!document) {
    return empty;
  }
  const parsed = parseDependencies(document);
  const result = { ...empty };
  for (const entry of parsed) {
    if (entry.category === "dependencies") {
      result.dependencies.push(entry.name);
    } else if (entry.category === "devDependencies") {
      result.devDependencies.push(entry.name);
    } else if (entry.category === "peerDependencies") {
      result.peerDependencies.push(entry.name);
    }
  }
  return result;
}

/** Returns a 32-character hex nonce for the webview's script CSP. */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
