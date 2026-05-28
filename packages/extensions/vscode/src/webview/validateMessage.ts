/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import type { WebviewRequest } from "./protocol";

/**
 * Every `WebviewRequest.type` the bridge knows how to handle. Used as
 * the allow-list when validating inbound messages; an unknown `type`
 * is logged at warn level and discarded so a future protocol change
 * (or a script that snuck into the same VSCode session) can't trigger
 * an unintended handler.
 */
const ALLOWED_TYPES: ReadonlySet<WebviewRequest["type"]> = new Set([
  "ready",
  "getLightStats",
  "getBundleData",
  "getDependencyTree",
  "viewPackage",
  "openPackageJson",
  "refreshStats",
  "setupMcp",
  "runProjectAnalysis",
  "getCachedProjectAnalysis",
  "revealFinding",
  "notify",
  "copyToClipboard",
] as const);

/**
 * Result of validating one inbound webview message. `ok: true` means
 * the payload matched the protocol; `ok: false` carries a short reason
 * the caller can log.
 */
export type ValidationResult =
  | { ok: true; message: WebviewRequest }
  | { ok: false; reason: string };

/**
 * Workspace folder context used to refuse paths that would otherwise
 * let a malformed message read or open files outside the user's open
 * folders. The validator works without it (paths are then only shape-
 * checked, not bound to the workspace) so tests don't have to pull in
 * the real `vscode.workspace.workspaceFolders` API.
 */
export interface WorkspaceContext {
  /** Filesystem paths of every workspace folder currently open. */
  folders: readonly string[];
}

/**
 * Validate one raw payload from `webview.onDidReceiveMessage`. Returns
 * the strongly-typed message on success; on failure returns a short
 * reason the caller can log. Rejects messages whose `type` isn't in
 * the allow-list, whose required string fields are missing, and whose
 * file paths point outside the workspace.
 *
 * The check is structural — VSCode's webview channel already
 * authenticates the sender (only the host's own webview can post to
 * the host), so this isn't an authentication layer. It is a defence
 * against a buggy / hostile script in the same webview document
 * crafting a payload that triggers a filesystem-effect handler with
 * an attacker-controlled path.
 */
export function validateWebviewMessage(
  raw: unknown,
  workspace?: WorkspaceContext,
): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "payload is not an object" };
  }
  const message = raw as Record<string, unknown>;
  const type = message.type;
  if (typeof type !== "string") {
    return { ok: false, reason: "missing or non-string `type` field" };
  }
  if (!ALLOWED_TYPES.has(type as WebviewRequest["type"])) {
    return { ok: false, reason: `unknown message type: ${type}` };
  }

  switch (type as WebviewRequest["type"]) {
    case "ready":
    case "refreshStats":
    case "setupMcp":
      return { ok: true, message: message as WebviewRequest };

    case "getLightStats": {
      const fieldsOk =
        isNonEmptyString(message.requestId) &&
        isNonEmptyString(message.packageName) &&
        isString(message.category);
      if (!fieldsOk) {
        return {
          ok: false,
          reason: "getLightStats missing requestId / packageName / category",
        };
      }
      return { ok: true, message: message as WebviewRequest };
    }

    case "getBundleData": {
      const fieldsOk =
        isNonEmptyString(message.requestId) &&
        isNonEmptyString(message.packageName);
      if (!fieldsOk) {
        return {
          ok: false,
          reason: "getBundleData missing requestId / packageName",
        };
      }
      return { ok: true, message: message as WebviewRequest };
    }

    case "getDependencyTree": {
      const fieldsOk =
        isNonEmptyString(message.requestId) &&
        isNonEmptyString(message.packageName);
      if (!fieldsOk) {
        return {
          ok: false,
          reason: "getDependencyTree missing requestId / packageName",
        };
      }
      return { ok: true, message: message as WebviewRequest };
    }

    case "viewPackage": {
      if (!isNonEmptyString(message.packageName)) {
        return { ok: false, reason: "viewPackage missing packageName" };
      }
      return { ok: true, message: message as WebviewRequest };
    }

    case "openPackageJson": {
      if (!isNonEmptyString(message.uri)) {
        return { ok: false, reason: "openPackageJson missing uri" };
      }
      const inside = isUriInsideWorkspace(message.uri, workspace);
      if (!inside) {
        return {
          ok: false,
          reason: `openPackageJson uri outside workspace: ${message.uri}`,
        };
      }
      return { ok: true, message: message as WebviewRequest };
    }

    case "runProjectAnalysis":
    case "getCachedProjectAnalysis": {
      if (
        !isNonEmptyString(message.requestId) ||
        !isNonEmptyString(message.packageJsonUri)
      ) {
        return {
          ok: false,
          reason: `${type} missing requestId / packageJsonUri`,
        };
      }
      if (!isUriInsideWorkspace(message.packageJsonUri, workspace)) {
        return {
          ok: false,
          reason: `${type} packageJsonUri outside workspace: ${message.packageJsonUri}`,
        };
      }
      return { ok: true, message: message as WebviewRequest };
    }

    case "revealFinding": {
      if (!isNonEmptyString(message.filePath)) {
        return { ok: false, reason: "revealFinding missing filePath" };
      }
      if (!isPathInsideWorkspace(message.filePath, workspace)) {
        return {
          ok: false,
          reason: `revealFinding filePath outside workspace: ${message.filePath}`,
        };
      }
      const range = message.range;
      if (range !== undefined && !isRangeShape(range)) {
        return { ok: false, reason: "revealFinding has malformed range" };
      }
      return { ok: true, message: message as WebviewRequest };
    }

    case "notify": {
      const levelOk =
        message.level === "info" ||
        message.level === "warning" ||
        message.level === "error";
      if (!levelOk || !isNonEmptyString(message.message)) {
        return {
          ok: false,
          reason: "notify missing level (info|warning|error) or message",
        };
      }
      return { ok: true, message: message as WebviewRequest };
    }

    case "copyToClipboard": {
      if (!isNonEmptyString(message.text)) {
        return { ok: false, reason: "copyToClipboard missing text" };
      }
      if (message.toast !== undefined && !isString(message.toast)) {
        return { ok: false, reason: "copyToClipboard has non-string toast" };
      }
      return { ok: true, message: message as WebviewRequest };
    }
  }
}

/** True for a non-empty string value. */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** True for any string value (including the empty string). */
function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Validate that the four range fields exist and are non-negative
 * finite numbers. Mirrors what `vscode.Range` itself requires.
 */
function isRangeShape(value: unknown): value is {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const range = value as Record<string, unknown>;
  return (
    isNonNegativeFinite(range.startLine) &&
    isNonNegativeFinite(range.startColumn) &&
    isNonNegativeFinite(range.endLine) &&
    isNonNegativeFinite(range.endColumn)
  );
}

/** True for a finite, non-negative number. */
function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Decide whether a `vscode.Uri.toString()` value points at a location
 * inside one of the workspace folders. When no workspace context is
 * supplied the check is skipped (a non-workspace caller still gets
 * shape validation).
 */
function isUriInsideWorkspace(
  uriString: string,
  workspace: WorkspaceContext | undefined,
): boolean {
  if (!workspace || workspace.folders.length === 0) {
    return true;
  }
  let parsed: vscode.Uri;
  try {
    parsed = vscode.Uri.parse(uriString);
  } catch {
    return false;
  }
  return isPathInsideWorkspace(parsed.fsPath ?? parsed.path, workspace);
}

/**
 * Refuse paths that escape the workspace folders via `..` segments or
 * absolute paths to elsewhere. Accepts any path inside any workspace
 * folder's filesystem subtree.
 */
function isPathInsideWorkspace(
  filePath: string,
  workspace: WorkspaceContext | undefined,
): boolean {
  // When no folder is open (VSCode launched against a standalone file)
  // there's no boundary to enforce; only refuse paths that contain
  // explicit `..` escapes so a workspace-less session still rejects
  // the worst-case shape.
  if (!workspace || workspace.folders.length === 0) {
    if (typeof filePath !== "string" || filePath.length === 0) {
      return false;
    }
    const normalised = filePath.replace(/\\/g, "/");
    return !normalised.split("/").includes("..");
  }
  if (typeof filePath !== "string" || filePath.length === 0) {
    return false;
  }
  // Reject anything with `..` segments after normalising to forward
  // slashes — VSCode webview messages should reference clean absolute
  // paths, never relative escapes.
  const normalised = filePath.replace(/\\/g, "/");
  if (normalised.split("/").includes("..")) {
    return false;
  }
  return workspace.folders.some((folder) => {
    const folderNormalised = folder.replace(/\\/g, "/").replace(/\/$/, "");
    return (
      normalised === folderNormalised ||
      normalised.startsWith(`${folderNormalised}/`)
    );
  });
}
