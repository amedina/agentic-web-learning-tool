/**
 * External dependencies.
 */
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
import { VIEW_PACKAGE_COMMAND } from "../commands/viewPackage";
import type { NpmAdvisorSettings } from "../diagnostics/settings";
import type { ExtensionMessage, WebviewRequest } from "./protocol";

const VERSION_KEY_FOR_WEBVIEW = "latest";

export interface WebviewBridgeDeps {
  cache: StatsCache;
  settingsProvider: () => NpmAdvisorSettings;
}

/**
 * Routes WebviewRequest messages from the webview to the extension's
 * services (StatsCache for light stats / bundle data, analyzer-core
 * directly for dependency trees, and a `commands.executeCommand` call
 * for npmjs.com navigation). Posts ExtensionMessage responses back
 * over the same webview channel.
 */
export class WebviewBridge {
  private readonly cache: StatsCache;
  private readonly settingsProvider: () => NpmAdvisorSettings;
  private webview: vscode.Webview | null = null;
  private isReady = false;
  private pendingOutbound: ExtensionMessage[] = [];
  private readonly onReadyListeners = new Set<() => void>();

  /** Stores the cache and settings provider to be used per-request. */
  constructor(deps: WebviewBridgeDeps) {
    this.cache = deps.cache;
    this.settingsProvider = deps.settingsProvider;
  }

  /**
   * Binds the bridge to a webview and starts handling its messages.
   * Resets the ready handshake so each (re-)mount of the webview
   * blocks outbound messages until the React app signals it's
   * listening. Returns a Disposable that detaches the listener.
   */
  attach(webview: vscode.Webview): vscode.Disposable {
    this.webview = webview;
    this.isReady = false;
    this.pendingOutbound = [];
    return webview.onDidReceiveMessage((message) => {
      void this.handle(message as WebviewRequest);
    });
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
