/**
 * External dependencies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { WebviewBridge } from "../bridge";
import type { ExtensionMessage, WebviewRequest } from "../protocol";

interface MessageListener {
  (message: WebviewRequest): void;
}

/**
 * Minimal stand-in for vscode.Webview that captures every host →
 * webview message into `posted` and lets tests fire request messages
 * by calling `dispatch` (mirroring what onDidReceiveMessage does in
 * the real API).
 */
class FakeWebview {
  posted: ExtensionMessage[] = [];
  private listener: MessageListener | null = null;

  postMessage(message: ExtensionMessage): Promise<boolean> {
    this.posted.push(message);
    return Promise.resolve(true);
  }

  onDidReceiveMessage(listener: MessageListener): { dispose(): void } {
    this.listener = listener;
    return {
      dispose: () => {
        this.listener = null;
      },
    };
  }

  dispatch(message: WebviewRequest): void {
    this.listener?.(message);
  }
}

const sampleStats: PackageStats = {
  packageName: "lodash",
  description: null,
  latestVersion: "4.17.21",
  githubUrl: null,
  stars: null,
  collaboratorsCount: null,
  lastCommitDate: null,
  responsiveness: null,
  securityAdvisories: null,
  bundle: {
    size: 1234,
    gzip: 567,
    isTreeShakeable: true,
    hasSideEffects: false,
  },
  dependencyTree: null,
  license: null,
  licenseCompatibility: null,
  recommendations: {},
  score: 80,
  scoreBreakdown: [],
  scoreMaxPoints: 100,
  githubRateLimited: false,
  githubIssuesUnavailable: false,
} as PackageStats;

describe("WebviewBridge", () => {
  let executeCommandSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    executeCommandSpy = vi
      .spyOn(vscode.commands, "executeCommand")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    executeCommandSpy.mockRestore();
  });

  it("posts an ok lightStats response when the cache resolves", async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(sampleStats),
    };
    const bridge = new WebviewBridge({
      cache: cache as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({
      type: "getLightStats",
      requestId: "req-1",
      packageName: "lodash",
      category: "runtime",
    });
    await flushAsync();
    expect(cache.get).toHaveBeenCalledWith("lodash", "latest");
    expect(fakeWebview.posted).toEqual([
      { type: "lightStats", requestId: "req-1", ok: true, data: sampleStats },
    ]);
  });

  it("posts an error lightStats response when the cache throws", async () => {
    const cache = {
      get: vi.fn().mockRejectedValue(new Error("boom")),
    };
    const bridge = new WebviewBridge({
      cache: cache as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({
      type: "getLightStats",
      requestId: "req-2",
      packageName: "lodash",
      category: "runtime",
    });
    await flushAsync();
    expect(fakeWebview.posted).toEqual([
      { type: "lightStats", requestId: "req-2", ok: false, error: "boom" },
    ]);
  });

  it("returns cached bundle data when the cache already has stats", async () => {
    const cache = {
      get: vi.fn().mockResolvedValue(sampleStats),
    };
    const bridge = new WebviewBridge({
      cache: cache as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({
      type: "getBundleData",
      requestId: "req-3",
      packageName: "lodash",
    });
    await flushAsync();
    expect(fakeWebview.posted).toEqual([
      {
        type: "bundleData",
        requestId: "req-3",
        ok: true,
        data: sampleStats.bundle,
      },
    ]);
  });

  it("forwards viewPackage messages to the npmAdvisor.viewPackage command", async () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({
      type: "viewPackage",
      packageName: "lodash",
    });
    await flushAsync();
    expect(executeCommandSpy).toHaveBeenCalledWith(
      "npmAdvisor.viewPackage",
      "lodash",
    );
    expect(fakeWebview.posted).toEqual([]);
  });

  it("buffers outbound messages until the webview signals ready", () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    bridge.post({ type: "focusPackage", packageName: "lodash" });
    expect(fakeWebview.posted).toEqual([]);
    fakeWebview.dispatch({ type: "ready" });
    expect(fakeWebview.posted).toEqual([
      { type: "focusPackage", packageName: "lodash" },
    ]);
  });

  it("fires onReady listeners on every ready handshake, not just the first", () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    const callback = vi.fn();
    bridge.onReady(callback);
    fakeWebview.dispatch({ type: "ready" });
    expect(callback).toHaveBeenCalledTimes(1);

    // Simulate WebviewView re-show: VSCode reloads the script context
    // and the freshly-mounted React app posts ready again.
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("invokes onReady immediately when the webview is already ready", () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    const callback = vi.fn();
    bridge.onReady(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("posts immediately once ready and resets the buffer on re-attach", () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    bridge.post({ type: "focusPackage", packageName: "react" });
    expect(fakeWebview.posted).toEqual([
      { type: "focusPackage", packageName: "react" },
    ]);

    const remountedWebview = new FakeWebview();
    bridge.attach(remountedWebview as unknown as vscode.Webview);
    bridge.post({ type: "focusPackage", packageName: "vue" });
    expect(remountedWebview.posted).toEqual([]);
    remountedWebview.dispatch({ type: "ready" });
    expect(remountedWebview.posted).toEqual([
      { type: "focusPackage", packageName: "vue" },
    ]);
  });
});

/** Resolves on the next macrotask so awaited promises in the bridge handler settle. */
function flushAsync(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
