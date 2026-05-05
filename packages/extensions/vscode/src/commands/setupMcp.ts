/**
 * External dependencies.
 */
import * as vscode from "vscode";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

/**
 * Internal dependencies.
 */
import {
  buildClaudeCodeCommand,
  buildJsonMergePayload,
  buildServerEntry,
  getSupportedClients,
  mergeIntoExistingConfig,
  type McpClientDescriptor,
} from "../mcp/clientConfigs";

export const SETUP_MCP_COMMAND = "npmAdvisor.setupMcp";

interface SetupMcpDeps {
  extensionUri: vscode.Uri;
}

/**
 * Registers the "Set up MCP for AI clients" command. Walks the user
 * through registering the bundled npm-advisor MCP server with their
 * MCP-aware AI clients (Claude Desktop, Cursor, VSCode native MCP,
 * Claude Code). Each json-merge client gets a confirmation prompt
 * before any file is touched and a timestamped .bak of the prior
 * config; Claude Code falls through to a clipboard-copy of its CLI
 * snippet because writing its config directly fights with its own
 * merge logic.
 */
export function registerSetupMcpCommand(deps: SetupMcpDeps): vscode.Disposable {
  return vscode.commands.registerCommand(SETUP_MCP_COMMAND, async () => {
    const serverScriptPath = vscode.Uri.joinPath(
      deps.extensionUri,
      "dist",
      "mcp",
      "server.js",
    ).fsPath;

    const clients = getSupportedClients();
    const items: vscode.QuickPickItem[] = clients.map((client) => ({
      label: client.label,
      description: client.description,
      detail: describeClient(client),
      picked: defaultPickedFor(client),
    }));

    const selected = await vscode.window.showQuickPick(items, {
      title: "NPM Advisor: Set up MCP for AI clients",
      placeHolder:
        "Select every AI client you want to register the npm-advisor MCP server with.",
      canPickMany: true,
    });

    if (!selected || selected.length === 0) {
      return;
    }

    const chosenClients = clients.filter((client) =>
      selected.some((item) => item.label === client.label),
    );

    let installed = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const client of chosenClients) {
      const result = await applyClient(client, serverScriptPath);
      if (result === "installed") {
        installed += 1;
      } else if (result === "skipped") {
        skipped += 1;
      } else {
        failures.push(`${client.label}: ${result.error}`);
      }
    }

    if (failures.length > 0) {
      void vscode.window.showWarningMessage(
        `NPM Advisor: ${installed} client${installed === 1 ? "" : "s"} configured, ${failures.length} failed. ${failures.join("; ")}`,
      );
    } else if (installed > 0) {
      void vscode.window.showInformationMessage(
        `NPM Advisor: Configured the MCP server for ${installed} client${installed === 1 ? "" : "s"}. Restart the affected client${installed === 1 ? "" : "s"} for the change to take effect.${skipped > 0 ? ` ${skipped} skipped.` : ""}`,
      );
    }
  });
}

/**
 * Routes a single client to the right install path:
 *  - `json-merge` clients: confirm the destination file, merge our
 *    entry into existing JSON (preserving every other key), back up
 *    the old file with a timestamp suffix, write atomically.
 *  - `cli-snippet` clients (Claude Code): copy the CLI command to
 *    the clipboard and surface a one-shot info notification.
 * Returns "installed" on success, "skipped" if the user backed out
 * at the confirmation, or `{ error }` on a fs / parse failure.
 */
async function applyClient(
  client: McpClientDescriptor,
  serverScriptPath: string,
): Promise<"installed" | "skipped" | { error: string }> {
  if (client.strategy.kind === "cli-snippet") {
    const command = buildClaudeCodeCommand(serverScriptPath);
    const action = await vscode.window.showInformationMessage(
      `Copy the Claude Code command to your clipboard? Paste it into a terminal at any project root, then restart Claude Code.\n\n${command}\n\nIf you previously installed under the legacy name, remove it first:\n\nclaude mcp remove npm-advisor`,
      { modal: true },
      "Copy command",
    );
    if (action !== "Copy command") {
      return "skipped";
    }
    await vscode.env.clipboard.writeText(command);
    return "installed";
  }

  const configPath = resolveConfigPath(client.strategy.configPath);
  if (!configPath) {
    return {
      error:
        "Workspace MCP requires an open workspace folder; open a folder and try again.",
    };
  }

  const action = await vscode.window.showInformationMessage(
    `Add the npm-advisor MCP server to ${client.label}?\n\nConfig file: ${configPath}\n\nAny existing entries are preserved; the previous file is backed up alongside.`,
    { modal: true },
    "Install",
  );
  if (action !== "Install") {
    return "skipped";
  }

  try {
    writeMergedConfig(configPath, client, serverScriptPath);
    return "installed";
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Reads the existing config (treating missing / empty / invalid as
 * "no prior config"), merges our server entry in, writes a `.bak`
 * with the prior contents when one existed, then atomically replaces
 * the live file. The .bak suffix is timestamped so repeated runs
 * don't overwrite earlier backups.
 */
function writeMergedConfig(
  configPath: string,
  client: McpClientDescriptor,
  serverScriptPath: string,
): void {
  const entry = buildServerEntry(serverScriptPath);
  let existing: Record<string, unknown> | null = null;
  if (existsSync(configPath)) {
    try {
      const text = readFileSync(configPath, "utf8");
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        existing = parsed as Record<string, unknown>;
      }
    } catch {
      // Treat unparseable existing files as "start from scratch", but
      // back them up first so the user can recover their own JSON.
      const backupPath = `${configPath}.${timestamp()}.bak`;
      writeFileSync(backupPath, readFileSync(configPath, "utf8"));
    }
  }

  if (existsSync(configPath) && existing) {
    const backupPath = `${configPath}.${timestamp()}.bak`;
    writeFileSync(backupPath, readFileSync(configPath, "utf8"));
  }

  const merged = existing
    ? mergeIntoExistingConfig(client.id, existing, entry)
    : buildJsonMergePayload(client.id, entry);

  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(merged, null, 2)}\n`);
}

/**
 * Workspace-relative paths in the client list (currently only
 * VSCode's `.vscode/mcp.json`) need a workspace folder to anchor
 * against. Returns null when there's no folder open.
 */
function resolveConfigPath(rawPath: string): string | null {
  if (isAbsolute(rawPath)) {
    return rawPath;
  }
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return null;
  }
  return resolve(workspaceFolder.uri.fsPath, rawPath);
}

/**
 * Detail line shown under each client in the QuickPick. For
 * json-merge clients we show the resolved destination path so the
 * user knows exactly what file would be touched; for the CLI-snippet
 * client we explain the snippet flow.
 */
function describeClient(client: McpClientDescriptor): string {
  if (client.strategy.kind === "cli-snippet") {
    return "Copies the `claude mcp add` command to your clipboard.";
  }
  const resolved = resolveConfigPath(client.strategy.configPath);
  return resolved
    ? `Writes ${resolved}`
    : `Writes ${client.strategy.configPath} (no workspace folder is open right now)`;
}

/**
 * VSCode workspace MCP starts unchecked because it only applies if
 * the user has a workspace folder open AND wants Copilot agent mode
 * to discover the server. Every other client is checked by default
 * so the common case ("install for all clients I have") is one
 * confirmation away.
 */
function defaultPickedFor(client: McpClientDescriptor): boolean {
  if (client.id === "vscode") {
    return false;
  }
  if (client.strategy.kind === "json-merge") {
    return existsSync(client.strategy.configPath);
  }
  return false;
}

/** Compact ISO-ish timestamp suitable for embedding in a filename. */
function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
