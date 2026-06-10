/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import { validateWebviewMessage } from "../validateMessage";

const workspace = { folders: ["/workspace/root"] };

describe("validateWebviewMessage - shape", () => {
  it("accepts a known no-payload message", () => {
    expect(validateWebviewMessage({ type: "ready" })).toEqual({
      ok: true,
      message: { type: "ready" },
    });
  });

  it("rejects a null payload", () => {
    expect(validateWebviewMessage(null).ok).toBe(false);
  });

  it("rejects a payload with a non-string type", () => {
    expect(validateWebviewMessage({ type: 42 }).ok).toBe(false);
  });

  it("rejects an unknown type", () => {
    const result = validateWebviewMessage({ type: "rmRfRoot" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("unknown message type");
    }
  });
});

describe("validateWebviewMessage - per-type payload", () => {
  it("requires requestId + packageName for getLightStats", () => {
    expect(
      validateWebviewMessage({
        type: "getLightStats",
        requestId: "1",
        packageName: "react",
        category: "runtime",
      }).ok,
    ).toBe(true);
    expect(
      validateWebviewMessage({ type: "getLightStats", packageName: "react" })
        .ok,
    ).toBe(false);
  });

  it("requires non-empty packageName for viewPackage", () => {
    expect(
      validateWebviewMessage({ type: "viewPackage", packageName: "react" }).ok,
    ).toBe(true);
    expect(
      validateWebviewMessage({ type: "viewPackage", packageName: "" }).ok,
    ).toBe(false);
  });

  it("requires level + message for notify", () => {
    expect(
      validateWebviewMessage({
        type: "notify",
        level: "info",
        message: "hi",
      }).ok,
    ).toBe(true);
    expect(
      validateWebviewMessage({
        type: "notify",
        level: "panic",
        message: "hi",
      }).ok,
    ).toBe(false);
  });

  it("accepts getProjectHealthSettings with no payload", () => {
    expect(
      validateWebviewMessage({ type: "getProjectHealthSettings" }).ok,
    ).toBe(true);
  });

  it("requires a boolean enabled for setProjectHealthAutoRun", () => {
    expect(
      validateWebviewMessage({
        type: "setProjectHealthAutoRun",
        enabled: true,
      }).ok,
    ).toBe(true);
    expect(
      validateWebviewMessage({
        type: "setProjectHealthAutoRun",
        enabled: "yes",
      }).ok,
    ).toBe(false);
    expect(validateWebviewMessage({ type: "setProjectHealthAutoRun" }).ok).toBe(
      false,
    );
  });

  it("requires non-empty text for copyToClipboard and accepts an optional toast", () => {
    expect(
      validateWebviewMessage({
        type: "copyToClipboard",
        text: "fix prompt",
        toast: "Copied",
      }).ok,
    ).toBe(true);
    expect(
      validateWebviewMessage({ type: "copyToClipboard", text: "" }).ok,
    ).toBe(false);
    expect(
      validateWebviewMessage({
        type: "copyToClipboard",
        text: "fix prompt",
        toast: 42,
      }).ok,
    ).toBe(false);
  });
});

describe("validateWebviewMessage - workspace boundary", () => {
  it("accepts openPackageJson when the URI lives inside a workspace folder", () => {
    const result = validateWebviewMessage(
      {
        type: "openPackageJson",
        uri: "file:///workspace/root/packages/a/package.json",
      },
      workspace,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects openPackageJson when the URI lives outside any workspace folder", () => {
    const result = validateWebviewMessage(
      {
        type: "openPackageJson",
        uri: "file:///etc/passwd",
      },
      workspace,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("outside workspace");
    }
  });

  it("rejects revealFinding paths that contain .. segments", () => {
    const result = validateWebviewMessage(
      {
        type: "revealFinding",
        filePath: "/workspace/root/../../../etc/passwd",
      },
      workspace,
    );
    expect(result.ok).toBe(false);
  });

  it("rejects revealFinding when no workspace folder covers the path", () => {
    const result = validateWebviewMessage(
      {
        type: "revealFinding",
        filePath: "/somewhere/else/file.ts",
      },
      workspace,
    );
    expect(result.ok).toBe(false);
  });

  it("accepts revealFinding with a valid range inside the workspace", () => {
    const result = validateWebviewMessage(
      {
        type: "revealFinding",
        filePath: "/workspace/root/src/foo.ts",
        range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 5 },
      },
      workspace,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects revealFinding with a malformed range", () => {
    const result = validateWebviewMessage(
      {
        type: "revealFinding",
        filePath: "/workspace/root/src/foo.ts",
        range: { startLine: -1, startColumn: 0, endLine: 0, endColumn: 5 },
      },
      workspace,
    );
    expect(result.ok).toBe(false);
  });

  it("skips workspace checks entirely when no workspace context is supplied", () => {
    const result = validateWebviewMessage({
      type: "openPackageJson",
      uri: "file:///somewhere/else/package.json",
    });
    expect(result.ok).toBe(true);
  });
});
