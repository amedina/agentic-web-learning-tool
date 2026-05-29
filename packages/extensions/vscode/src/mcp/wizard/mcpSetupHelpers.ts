/**
 * Internal dependencies.
 */
import {
  buildClaudeCodeCommand,
  buildClaudeCodeListCommand,
  buildClaudeCodeRemoveCommand,
  getSupportedClients,
  type McpClientDescriptor,
  type McpClientId,
} from "../clientConfigs";
import { isProbablyInstalled } from "../clientDetection";
import {
  getClientStatus,
  listBackups,
  type McpClientStatus,
} from "../operations";
import type { McpClientView } from "./protocol";

/** Finds a descriptor by id, or returns null when the id is unknown. */
export function findClient(clientId: McpClientId): McpClientDescriptor | null {
  return getSupportedClients().find((client) => client.id === clientId) ?? null;
}

/**
 * Builds a per-client view object for every supported client. Adds
 * Claude Code's CLI install / remove / list commands to the descriptor
 * so the card's "Run in terminal" button and overflow-menu actions can
 * resolve the string locally without an extra round-trip.
 *
 * @param serverScriptPath Absolute path of the bundled MCP server script.
 * @returns One `McpClientView` per supported client.
 */
export function collectClientViews(serverScriptPath: string): McpClientView[] {
  return getSupportedClients().map((client) => {
    const status = getClientStatus(client, serverScriptPath);
    const { paths: backupPaths } = listBackups(client);
    const view: McpClientView = {
      id: client.id,
      label: client.label,
      description: client.description,
      docsUrl: client.docsUrl,
      status,
      backupCount: backupPaths.length,
      latestBackupPath: backupPaths[0],
      detected: isProbablyInstalled(client),
    };
    if (client.strategy.kind === "cli-snippet") {
      view.cliCommand = buildClaudeCodeCommand(serverScriptPath);
      view.cliRemoveCommand = buildClaudeCodeRemoveCommand();
      view.cliListCommand = buildClaudeCodeListCommand();
    }
    return view;
  });
}

/**
 * Pulls the configPath out of an `McpClientStatus` regardless of which
 * variant it is. Centralizes the discriminated-union spread so the
 * panel's open/reveal handlers don't repeat the type narrowing.
 */
export function configPathFromStatus(status: McpClientStatus): string | null {
  if (
    status.kind === "installed" ||
    status.kind === "installed-stale" ||
    status.kind === "not-installed" ||
    status.kind === "no-config" ||
    status.kind === "error"
  ) {
    return status.configPath;
  }
  return null;
}

/**
 * Friendly error string for status variants that block an open /
 * reveal action (e.g. "workspace-required" or "error"). Keeps the
 * panel's two handlers consistent in what they say to the user.
 */
export function statusErrorMessage(status: McpClientStatus): string {
  if (status.kind === "workspace-required") {
    return "Open a workspace folder first — this client's config lives inside it.";
  }
  if (status.kind === "error") {
    return `Couldn't read config file: ${status.message}`;
  }
  return "Couldn't resolve the config path for this client.";
}

/** Returns a 32-character hex nonce for the webview's script CSP. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
