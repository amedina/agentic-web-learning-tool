/**
 * External dependencies.
 */
import * as path from "node:path";
import * as vscode from "vscode";
import {
  getDependencyTree,
  getPackageStats,
  type PackageStats,
} from "@agentic-web-labs/package-analyzer-core";
import type { BundleData } from "@agentic-web-labs/package-analyzer-ui";

/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";
import { SIGN_IN_GITHUB_COMMAND } from "../commands/githubAuth";
import { SETUP_MCP_COMMAND } from "../commands/setupMcp";
import { VIEW_PACKAGE_COMMAND } from "../commands/viewPackage";
import { runProjectAnalysis } from "../diagnostics/projectAnalysisRunner";
import type { NpmAdvisorSettings } from "../diagnostics/settings";
import type { GithubAuthService } from "../services/githubAuthService";
import type { ExtensionMessage, WebviewRequest } from "./protocol";

const VERSION_KEY_FOR_WEBVIEW = "latest";
const RATE_LIMITED_DEDUPE_KEY = "github-rate-limited";
const SIGN_IN_ACTION_LABEL = "Sign in to GitHub";

export interface WebviewBridgeDeps {
  cache: StatsCache;
  settingsProvider: () => NpmAdvisorSettings;
  githubAuth: GithubAuthService;
  /**
   * DiagnosticCollection populated by project-level analysis (publint +
   * replacement opportunities). The bridge writes to it whenever the
   * webview triggers a run, so the Problems panel and the webview tab
   * stay in sync.
   */
  projectAnalysisCollection: vscode.DiagnosticCollection;
}

/**
 * Routes WebviewRequest messages from the webview to the extension's
 * services (StatsCache for light stats / bundle data, analyzer-core
 * directly for dependency trees, and a `commands.executeCommand` call
 * for npmjs.com navigation). Posts ExtensionMessage responses back
 * over the same webview channel.
 */
export class WebviewBridge implements vscode.Disposable {
  private readonly cache: StatsCache;
  private readonly settingsProvider: () => NpmAdvisorSettings;
  private readonly githubAuth: GithubAuthService;
  private readonly projectAnalysisCollection: vscode.DiagnosticCollection;
  private webview: vscode.Webview | null = null;
  private webviewSubscription: vscode.Disposable | null = null;
  private isReady = false;
  private pendingOutbound: ExtensionMessage[] = [];
  private readonly onReadyListeners = new Set<() => void>();
  private readonly shownNotifications = new Set<string>();

  /**
   * Stores the cache, settings provider, GitHub auth service, and the
   * project-analysis DiagnosticCollection so handlers don't need to
   * pass them through individually.
   */
  constructor(deps: WebviewBridgeDeps) {
    this.cache = deps.cache;
    this.settingsProvider = deps.settingsProvider;
    this.githubAuth = deps.githubAuth;
    this.projectAnalysisCollection = deps.projectAnalysisCollection;
  }

  /**
   * Binds the bridge to a webview and starts handling its messages.
   * Disposes any previous webview subscription so re-attaching to a
   * fresh webview never leaks listeners on the old one. Resets the
   * ready handshake so outbound messages buffer until the React app
   * signals it's listening. Returns a Disposable that detaches the
   * listener — duplicates the internal cleanup so callers that want
   * fine-grained control can dispose without disposing the bridge.
   */
  attach(webview: vscode.Webview): vscode.Disposable {
    this.webviewSubscription?.dispose();
    this.webview = webview;
    this.isReady = false;
    this.pendingOutbound = [];
    this.webviewSubscription = webview.onDidReceiveMessage((message) => {
      void this.handle(message as WebviewRequest);
    });
    return this.webviewSubscription;
  }

  /**
   * Releases the message-handler subscription and clears every
   * onReady listener. Called when the extension deactivates so the
   * underlying webview-event subscriptions don't outlive the host.
   */
  dispose(): void {
    this.webviewSubscription?.dispose();
    this.webviewSubscription = null;
    this.webview = null;
    this.onReadyListeners.clear();
    this.pendingOutbound = [];
    this.isReady = false;
  }

  /**
   * Subscribes to every ready handshake from the webview. Fires
   * immediately if the webview is already ready, then again on each
   * subsequent ready signal — essential for VSCode WebviewView, where
   * the script context is destroyed and recreated on every visibility
   * transition (no retainContextWhenHidden equivalent on this API),
   * so the React app re-mounts and needs init pushed each time.
   * Returns a Disposable that unsubscribes the listener.
   */
  onReady(callback: () => void): vscode.Disposable {
    this.onReadyListeners.add(callback);
    if (this.isReady) {
      callback();
    }
    return { dispose: () => this.onReadyListeners.delete(callback) };
  }

  /**
   * Pushes a host → webview message. Before the ready handshake the
   * message is buffered and flushed once the webview signals it's
   * listening — without this, messages posted from
   * `resolveWebviewView` arrive before the React listener mounts and
   * are silently dropped.
   */
  post(message: ExtensionMessage): void {
    if (!this.isReady) {
      this.pendingOutbound.push(message);
      return;
    }
    void this.webview?.postMessage(message);
  }

  /**
   * Single entry point for every webview-originated message. Each
   * branch resolves the request and posts a typed response (or fires
   * a side-effect command for fire-and-forget messages).
   */
  private async handle(message: WebviewRequest): Promise<void> {
    if (!this.webview) {
      return;
    }
    switch (message.type) {
      case "ready": {
        this.isReady = true;
        const buffered = this.pendingOutbound;
        this.pendingOutbound = [];
        for (const queued of buffered) {
          void this.webview.postMessage(queued);
        }
        for (const listener of this.onReadyListeners) {
          listener();
        }
        return;
      }
      case "getLightStats": {
        try {
          const stats = await this.cache.get(
            message.packageName,
            VERSION_KEY_FOR_WEBVIEW,
          );
          this.post({
            type: "lightStats",
            requestId: message.requestId,
            ok: true,
            data: stats,
          });
        } catch (error) {
          this.post({
            type: "lightStats",
            requestId: message.requestId,
            ok: false,
            error: errorMessage(error),
          });
        }
        return;
      }
      case "getBundleData": {
        try {
          const bundle = await this.fetchBundleData(message.packageName);
          this.post({
            type: "bundleData",
            requestId: message.requestId,
            ok: true,
            data: bundle,
          });
        } catch (error) {
          this.post({
            type: "bundleData",
            requestId: message.requestId,
            ok: false,
            error: errorMessage(error),
          });
        }
        return;
      }
      case "getDependencyTree": {
        try {
          const tree = await getDependencyTree(
            message.packageName,
            message.version ?? "latest",
          );
          this.post({
            type: "dependencyTree",
            requestId: message.requestId,
            ok: true,
            data: tree,
          });
        } catch (error) {
          this.post({
            type: "dependencyTree",
            requestId: message.requestId,
            ok: false,
            error: errorMessage(error),
          });
        }
        return;
      }
      case "viewPackage": {
        await vscode.commands.executeCommand(
          VIEW_PACKAGE_COMMAND,
          message.packageName,
        );
        return;
      }
      case "openPackageJson": {
        try {
          const uri = vscode.Uri.parse(message.uri);
          await vscode.window.showTextDocument(uri, { preview: false });
        } catch {
          // Swallow — the workspace may have moved the file between
          // discovery and click; the next scanner refresh will drop it.
        }
        return;
      }
      case "setupMcp": {
        await vscode.commands.executeCommand(SETUP_MCP_COMMAND);
        return;
      }
      case "refreshStats": {
        // Cache change emits onDidChange; provider's downstream
        // listeners + the diagnostics runner pick that up and re-init
        // the webview with empty stats so each row goes back to the
        // loading spinner while fresh data is fetched.
        await this.cache.clearAll();
        // Reset the notification dedupe set too, otherwise the user
        // wouldn't see the rate-limit toast again on a deliberate
        // refresh even if the limit is still reached.
        this.shownNotifications.clear();
        return;
      }
      case "runProjectAnalysis": {
        try {
          const packageJsonUri = vscode.Uri.parse(message.packageJsonUri);
          const rootPath = path.dirname(packageJsonUri.fsPath);
          const result = await runProjectAnalysis(
            this.projectAnalysisCollection,
            { rootPath },
          );
          this.post({
            type: "projectAnalysisResult",
            requestId: message.requestId,
            ok: true,
            data: result.analysis,
          });
        } catch (error) {
          this.post({
            type: "projectAnalysisResult",
            requestId: message.requestId,
            ok: false,
            error: errorMessage(error),
          });
        }
        return;
      }
      case "revealFinding": {
        try {
          const uri = vscode.Uri.file(message.filePath);
          const options: vscode.TextDocumentShowOptions = { preview: false };
          if (message.range) {
            options.selection = new vscode.Range(
              new vscode.Position(
                message.range.startLine,
                message.range.startColumn,
              ),
              new vscode.Position(
                message.range.endLine,
                message.range.endColumn,
              ),
            );
          }
          await vscode.window.showTextDocument(uri, options);
        } catch (error) {
          void vscode.window.showErrorMessage(
            `NPM Advisor: could not open ${message.filePath} — ${errorMessage(error)}`,
          );
        }
        return;
      }
      case "notify": {
        if (message.dedupeKey) {
          if (this.shownNotifications.has(message.dedupeKey)) {
            return;
          }
          this.shownNotifications.add(message.dedupeKey);
        }
        const offerSignIn =
          message.dedupeKey === RATE_LIMITED_DEDUPE_KEY &&
          !this.githubAuth.hasActiveSession();
        const actions = offerSignIn ? [SIGN_IN_ACTION_LABEL] : [];
        const surface =
          message.level === "error"
            ? vscode.window.showErrorMessage
            : message.level === "warning"
              ? vscode.window.showWarningMessage
              : vscode.window.showInformationMessage;
        const choice = await surface.call(
          vscode.window,
          message.message,
          ...actions,
        );
        if (choice === SIGN_IN_ACTION_LABEL) {
          await vscode.commands.executeCommand(SIGN_IN_GITHUB_COMMAND);
        }
        return;
      }
    }
  }

  /**
   * Tries the cache first so a previously fetched PackageStats can
   * supply bundle info without a second network round-trip; falls back
   * to a full analyzer fetch if the cache hasn't seen the package yet.
   */
  private async fetchBundleData(
    packageName: string,
  ): Promise<BundleData | null> {
    const cached = await this.cache.get(packageName, VERSION_KEY_FOR_WEBVIEW);
    if (cached?.bundle) {
      return cached.bundle;
    }
    const settings = this.settingsProvider();
    const stats: PackageStats | null = await getPackageStats(
      packageName,
      settings.targetLicense,
      { includeDependencyTree: false },
    );
    return stats?.bundle ?? null;
  }
}

/** Best-effort string extraction for error responses. */
function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
