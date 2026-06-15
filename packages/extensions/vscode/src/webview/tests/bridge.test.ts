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

/**
 * Returns a stand-in for GithubAuthService that the bridge can call
 * without touching VSCode's real authentication provider. By default
 * reports no active session; pass `{ signedIn: true }` to flip the
 * `hasActiveSession` branch the rate-limit toast checks. `getAuthStatus`
 * defaults to match `signedIn` (`authorized` / `signedOut`); pass an
 * explicit `status` to test the `needsAuthorization` banner case.
 */
function makeFakeAuth(
  options: {
    signedIn?: boolean;
    status?: "authorized" | "needsAuthorization" | "signedOut";
  } = {},
): never {
  const status =
    options.status ?? (options.signedIn ? "authorized" : "signedOut");
  return {
    getToken: vi.fn().mockResolvedValue(options.signedIn ? "tok" : null),
    hasActiveSession: () => Boolean(options.signedIn),
    getAuthStatus: vi.fn().mockResolvedValue(status),
    signIn: vi.fn().mockResolvedValue(true),
    signOut: vi.fn().mockReturnValue(false),
    onDidChange: vi.fn().mockReturnValue({ dispose: () => undefined }),
    dispose: vi.fn(),
  } as unknown as never;
}

/**
 * Returns an inert stand-in for `vscode.DiagnosticCollection` so bridge
 * tests can construct the bridge without exercising real diagnostics.
 * Each method is a no-op spy callable from tests that need to assert
 * project-analysis runs touched the collection.
 */
function makeFakeDiagnosticCollection(): never {
  return {
    name: "test",
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    forEach: vi.fn(),
    get: vi.fn(),
    has: vi.fn(),
    dispose: vi.fn(),
  } as unknown as never;
}

/**
 * Returns an inert stand-in for `ProjectAnalysisCache`. Bridge tests
 * never exercise the get/set/invalidate paths today, but the bridge
 * constructor requires the field.
 */
function makeFakeProjectAnalysisCache(): never {
  return {
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    invalidate: vi.fn(),
    clear: vi.fn(),
  } as unknown as never;
}

/**
 * Returns an inert stand-in for `ProjectHealthController`. The bridge
 * constructor subscribes to `onDidUpdate`, so that must return a
 * disposable; the run/cancel/getCached paths are no-ops unless a test
 * exercises them.
 */
function makeFakeProjectHealthController(
  options: { cached?: unknown } = {},
): never {
  return {
    onDidUpdate: vi.fn().mockReturnValue({ dispose: () => undefined }),
    run: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
    getCached: vi.fn().mockReturnValue(options.cached ?? null),
    isRunDue: vi.fn().mockReturnValue(true),
    isRunning: false,
    workspaceKey: vi.fn().mockReturnValue("ws"),
    workspaceName: vi.fn().mockReturnValue(null),
    suppressions: vi.fn().mockReturnValue([]),
    mute: vi.fn().mockResolvedValue(undefined),
    unmute: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
  } as unknown as never;
}

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
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
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
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
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
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
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

  it("calls cache.clearAll when the webview requests refreshStats", async () => {
    const clearAll = vi.fn().mockResolvedValue(0);
    const bridge = new WebviewBridge({
      cache: { get: vi.fn(), clearAll } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({ type: "refreshStats" });
    await flushAsync();
    expect(clearAll).toHaveBeenCalledTimes(1);
  });

  it("forwards notify to the matching vscode.window surface", async () => {
    const showWarningSpy = vi
      .spyOn(vscode.window, "showWarningMessage")
      .mockResolvedValue(undefined as never);
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({
      type: "notify",
      level: "warning",
      message: "test",
    });
    await flushAsync();
    expect(showWarningSpy).toHaveBeenCalledWith("test");
    showWarningSpy.mockRestore();
  });

  it("writes the text to the clipboard and confirms with a toast on copyToClipboard", async () => {
    const writeTextSpy = vi
      .spyOn(vscode.env.clipboard, "writeText")
      .mockResolvedValue(undefined);
    const showInfoSpy = vi
      .spyOn(vscode.window, "showInformationMessage")
      .mockResolvedValue(undefined as never);
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({
      type: "copyToClipboard",
      text: "fix prompt body",
      toast: "Copied!",
    });
    await flushAsync();
    expect(writeTextSpy).toHaveBeenCalledWith("fix prompt body");
    expect(showInfoSpy).toHaveBeenCalledWith("Copied!");
    writeTextSpy.mockRestore();
    showInfoSpy.mockRestore();
  });

  it("appends a Sign in action when rate-limited and unauthenticated", async () => {
    const showWarningSpy = vi
      .spyOn(vscode.window, "showWarningMessage")
      .mockResolvedValue("Sign in to GitHub" as never);
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth({ signedIn: false }),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({
      type: "notify",
      level: "warning",
      message: "rate limit",
      dedupeKey: "github-rate-limited",
    });
    await flushAsync();
    expect(showWarningSpy).toHaveBeenCalledWith(
      "rate limit",
      "Sign in to GitHub",
    );
    expect(executeCommandSpy).toHaveBeenCalledWith("npmAdvisor.signInToGitHub");
    showWarningSpy.mockRestore();
  });

  it("omits the Sign in action when rate-limited but already authenticated", async () => {
    const showWarningSpy = vi
      .spyOn(vscode.window, "showWarningMessage")
      .mockResolvedValue(undefined as never);
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth({ signedIn: true }),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({
      type: "notify",
      level: "warning",
      message: "rate limit",
      dedupeKey: "github-rate-limited",
    });
    await flushAsync();
    expect(showWarningSpy).toHaveBeenCalledWith("rate limit");
    expect(executeCommandSpy).not.toHaveBeenCalledWith(
      "npmAdvisor.signInToGitHub",
    );
    showWarningSpy.mockRestore();
  });

  it("posts githubAuthState signedOut when no GitHub account is available", async () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({ type: "getGithubAuthState" });
    await flushAsync();
    expect(fakeWebview.posted).toEqual([
      { type: "githubAuthState", status: "signedOut" },
    ]);
  });

  it("posts githubAuthState authorized when a GitHub session exists", async () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth({ signedIn: true }),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({ type: "getGithubAuthState" });
    await flushAsync();
    expect(fakeWebview.posted).toEqual([
      { type: "githubAuthState", status: "authorized" },
    ]);
  });

  it("runs the GitHub sign-in command on signInToGitHub", async () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({ type: "signInToGitHub" });
    await flushAsync();
    expect(executeCommandSpy).toHaveBeenCalledWith("npmAdvisor.signInToGitHub");
  });

  it("posts githubAuthState needsAuthorization when an account exists but NPM Advisor is not authorized", async () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth({ status: "needsAuthorization" }),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({ type: "getGithubAuthState" });
    await flushAsync();
    expect(fakeWebview.posted).toEqual([
      { type: "githubAuthState", status: "needsAuthorization" },
    ]);
  });

  it("dedupes notify messages by key within a session", async () => {
    const showWarningSpy = vi
      .spyOn(vscode.window, "showWarningMessage")
      .mockResolvedValue(undefined as never);
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    fakeWebview.dispatch({
      type: "notify",
      level: "warning",
      message: "rate limit",
      dedupeKey: "github-rate-limited",
    });
    fakeWebview.dispatch({
      type: "notify",
      level: "warning",
      message: "rate limit",
      dedupeKey: "github-rate-limited",
    });
    await flushAsync();
    expect(showWarningSpy).toHaveBeenCalledTimes(1);
    showWarningSpy.mockRestore();
  });

  it("disposes the previous webview subscription when re-attached", () => {
    const dispose1 = vi.fn();
    const dispose2 = vi.fn();
    const webview1 = {
      postMessage: vi.fn().mockResolvedValue(true),
      onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: dispose1 }),
    };
    const webview2 = {
      postMessage: vi.fn().mockResolvedValue(true),
      onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: dispose2 }),
    };
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    bridge.attach(webview1 as unknown as vscode.Webview);
    expect(dispose1).not.toHaveBeenCalled();
    bridge.attach(webview2 as unknown as vscode.Webview);
    expect(dispose1).toHaveBeenCalledTimes(1);
    bridge.dispose();
    expect(dispose2).toHaveBeenCalledTimes(1);
  });

  it("opens the package.json document when the webview requests openPackageJson", async () => {
    const showTextDocumentSpy = vi
      .spyOn(vscode.window, "showTextDocument")
      .mockResolvedValue(undefined as never);
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({
      type: "openPackageJson",
      uri: "file:///workspace/packages/foo/package.json",
    });
    await flushAsync();
    expect(showTextDocumentSpy).toHaveBeenCalledTimes(1);
    const [uriArg, optionsArg] = showTextDocumentSpy.mock.calls[0] as [
      { toString(): string },
      { preview: boolean },
    ];
    expect(uriArg.toString()).toBe(
      "file:///workspace/packages/foo/package.json",
    );
    expect(optionsArg).toEqual({ preview: false });
    showTextDocumentSpy.mockRestore();
  });

  it("forwards viewPackage messages to the npmAdvisor.viewPackage command", async () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
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
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
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
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
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
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
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
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
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

  it("pushes the cached Project Health report as a projectHealth message", () => {
    const cachedReport = { phase: "complete" };
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController({
        cached: cachedReport,
      }),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    bridge.pushCachedProjectHealth();
    expect(fakeWebview.posted).toEqual([
      { type: "projectHealth", report: cachedReport },
    ]);
  });

  it("pushes nothing when no Project Health report is cached", () => {
    const bridge = new WebviewBridge({
      cache: { get: vi.fn() } as unknown as never,
      settingsProvider: () => ({ targetLicense: "MIT" }) as never,
      githubAuth: makeFakeAuth(),
      projectAnalysisCollection: makeFakeDiagnosticCollection(),
      projectAnalysisCache: makeFakeProjectAnalysisCache(),
      projectHealthController: makeFakeProjectHealthController(),
    });
    const fakeWebview = new FakeWebview();
    bridge.attach(fakeWebview as unknown as vscode.Webview);
    fakeWebview.dispatch({ type: "ready" });
    bridge.pushCachedProjectHealth();
    expect(fakeWebview.posted).toEqual([]);
  });
});

/** Resolves on the next macrotask so awaited promises in the bridge handler settle. */
function flushAsync(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}
