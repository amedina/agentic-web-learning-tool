/**
 * External dependencies.
 */
import * as vscode from "vscode";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";
import { parseDependencies } from "../packageJson/parse";
import type { ActivePackageJsonTracker } from "../workspace/activePackageJsonTracker";
import type { PackageJsonScanner } from "../workspace/packageJsonScanner";
import type { WebviewBridge } from "../webview/bridge";
import type {
  PackageJsonDependenciesPayload,
  PackageJsonFile,
} from "../webview/protocol";

const VERSION_KEY_FOR_WEBVIEW = "latest";

export const WEBVIEW_VIEW_ID = "npmAdvisor.welcome";

interface NpmAdvisorWebviewProviderDeps {
  context: vscode.ExtensionContext;
  bridge: WebviewBridge;
  tracker: ActivePackageJsonTracker;
  scanner: PackageJsonScanner;
  cache: StatsCache;
}

/**
 * Hosts the React analyzer-ui inside the npm-advisor activity-bar
 * view. Builds the webview HTML, wires its postMessage channel to
 * WebviewBridge, and re-sends the package.json snapshot whenever the
 * tracker / scanner / workspace events change relevant state.
 */
export class NpmAdvisorWebviewProvider implements vscode.WebviewViewProvider {
  private readonly context: vscode.ExtensionContext;
  private readonly bridge: WebviewBridge;
  private readonly tracker: ActivePackageJsonTracker;
  private readonly scanner: PackageJsonScanner;
  private readonly cache: StatsCache;
  private webviewView: vscode.WebviewView | null = null;
  private pendingFocusPackageName: string | null = null;
  private onReadySubscription: vscode.Disposable | null = null;
  private refreshKey = 0;

  /** Stores context, bridge, and the active-file / scanner sources. */
  constructor(deps: NpmAdvisorWebviewProviderDeps) {
    this.context = deps.context;
    this.bridge = deps.bridge;
    this.tracker = deps.tracker;
    this.scanner = deps.scanner;
    this.cache = deps.cache;
  }

  /**
   * VSCode invokes this when the view becomes visible. We configure
   * CSP / asset roots, render the HTML shell, attach the bridge, and
   * subscribe to ready signals from the React app.
   *
   * VSCode WebviewView has no retainContextWhenHidden equivalent, so
   * the script context tears down on every hide and rebuilds on every
   * show. The React app remounts with empty state each time, so we
   * push a fresh init payload on every ready handshake — not just the
   * first one — otherwise re-shown panels stay stuck on "Loading…".
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
    this.onReadySubscription?.dispose();
    this.onReadySubscription = this.bridge.onReady(() => {
      const focusPackageName = this.pendingFocusPackageName ?? undefined;
      this.pendingFocusPackageName = null;
      void this.sendInitMessage(focusPackageName);
    });
    webviewView.onDidDispose(() => {
      this.onReadySubscription?.dispose();
      this.onReadySubscription = null;
    });
  }

  /**
   * Re-runs the package.json discovery and pushes a fresh `init`
   * payload to the webview. Called by extension.activate on workspace
   * events so the UI reflects edits without a manual refresh.
   */
  refresh(): void {
    if (this.webviewView) {
      void this.sendInitMessage();
    }
  }

  /**
   * Same as refresh(), but bumps the refreshKey so the webview tears
   * down and re-mounts DependenciesTab. Used when the host clears
   * the StatsCache so the React-side stats cache (held in module
   * scope by useDependencyStats) also gets thrown away.
   */
  forceRefresh(): void {
    this.refreshKey += 1;
    if (this.webviewView) {
      void this.sendInitMessage();
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
   * Builds and posts the init payload: the active package.json (if any),
   * the discovered file list for the switcher, and the parsed
   * dependency arrays for the active file. Empty arrays are sent when
   * no package.json is active so the React app shows the empty state.
   */
  private async sendInitMessage(focusPackageName?: string): Promise<void> {
    const activeDocument = this.tracker.document;
    const [availableFiles, activeFile] = await Promise.all([
      this.scanner.list(),
      activeDocument ? buildActiveFile(activeDocument) : Promise.resolve(null),
    ]);
    const packageJsonDependencies = activeDocument
      ? collectDependencies(activeDocument)
      : EMPTY_DEPENDENCIES;
    const prefetchedStats = collectPrefetchedStats(
      packageJsonDependencies,
      this.cache,
    );
    this.bridge.post({
      type: "init",
      activeFile,
      availableFiles,
      packageJsonDependencies,
      focusPackageName,
      refreshKey: this.refreshKey,
      prefetchedStats,
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

const EMPTY_DEPENDENCIES: PackageJsonDependenciesPayload = {
  dependencies: [],
  devDependencies: [],
  peerDependencies: [],
};

/**
 * Builds a PackageJsonFile descriptor for a given open document by
 * pulling its `name` field out of the parsed JSON. Falls back to a
 * null name when the document isn't valid JSON or lacks a name.
 */
async function buildActiveFile(
  document: vscode.TextDocument,
): Promise<PackageJsonFile> {
  let name: string | null = null;
  try {
    const parsed = JSON.parse(document.getText()) as { name?: unknown };
    name = typeof parsed.name === "string" ? parsed.name : null;
  } catch {
    name = null;
  }
  return {
    uri: document.uri.toString(),
    relativePath: vscode.workspace.asRelativePath(document.uri, true),
    name,
  };
}

/**
 * Synchronously collects every PackageStats already in StatsCache for
 * the deps in the payload, keyed by name. The webview seeds its
 * React-side stats cache from this so a panel re-show / script reload
 * doesn't re-issue a getLightStats round-trip per dep — entries listed
 * here resolve locally inside useDependencyStats. Deps absent from the
 * map (newly added since the last fetch) still go through the normal
 * fetch path.
 */
function collectPrefetchedStats(
  payload: PackageJsonDependenciesPayload,
  cache: StatsCache,
): Record<string, PackageStats | null> {
  const result: Record<string, PackageStats | null> = {};
  const allNames = new Set<string>([
    ...payload.dependencies,
    ...payload.devDependencies,
    ...payload.peerDependencies,
  ]);
  for (const name of allNames) {
    const cached = cache.peek(name, VERSION_KEY_FOR_WEBVIEW);
    if (cached !== undefined) {
      result[name] = cached;
    }
  }
  return result;
}

/**
 * Walks the dependency / devDependencies / peerDependencies sections
 * of a package.json document and returns the three name arrays the
 * webview needs to render DependenciesTab.
 */
function collectDependencies(
  document: vscode.TextDocument,
): PackageJsonDependenciesPayload {
  const parsed = parseDependencies(document);
  const result: PackageJsonDependenciesPayload = {
    dependencies: [],
    devDependencies: [],
    peerDependencies: [],
  };
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
