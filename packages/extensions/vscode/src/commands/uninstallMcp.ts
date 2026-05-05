/**
 * External dependencies.
 */
import * as vscode from "vscode";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

/**
 * Internal dependencies.
 */
import {
  buildClaudeCodeRemoveCommand,
  getSupportedClients,
  removeFromExistingConfig,
  type McpClientDescriptor,
} from "../mcp/clientConfigs";

export const UNINSTALL_MCP_COMMAND = "npmAdvisor.uninstallMcp";

/**
 * Registers the "Remove MCP server from AI clients" command. Mirrors
 * the install wizard but inverted: shows the same per-client
 * checklist, then for each json-merge client strips our entries
 * (current key + every legacy name) from the config file with a
 * timestamped backup. For Claude Code the modal copies the
 * `claude mcp remove` command to the clipboard since their CLI
 * already merges its own config.
 *
 * Exists as a separate command because Claude Desktop's "Disconnect"
 * UI is unreliable for stdio MCP servers added via direct config
 * edits — users need a one-click way to fully remove our entry
 * without hand-editing JSON.
 */
export function registerUninstallMcpCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(UNINSTALL_MCP_COMMAND, async () => {
    const clients = getSupportedClients();
    const items: vscode.QuickPickItem[] = clients.map((client) => ({
      label: client.label,
      description: client.description,
      detail: describeClient(client),
      picked: defaultPickedFor(client),
    }));

    const selected = await vscode.window.showQuickPick(items, {
      title: "NPM Advisor: Remove MCP server from AI clients",
      placeHolder:
        "Select every AI client you want to remove the npm-advisor MCP server from.",
      canPickMany: true,
    });

    if (!selected || selected.length === 0) {
      return;
    }

    const chosenClients = clients.filter((client) =>
      selected.some((item) => item.label === client.label),
    );

    let removed = 0;
    let nothingToRemove = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const client of chosenClients) {
      const result = await applyRemoval(client);
      if (result === "removed") {
        removed += 1;
      } else if (result === "nothing-to-remove") {
        nothingToRemove += 1;
      } else if (result === "skipped") {
        skipped += 1;
      } else {
        failures.push(`${client.label}: ${result.error}`);
      }
    }

    if (failures.length > 0) {
      void vscode.window.showWarningMessage(
        `NPM Advisor: ${removed} client${removed === 1 ? "" : "s"} cleaned, ${failures.length} failed. ${failures.join("; ")}`,
      );
      return;
    }

    const parts: string[] = [];
    if (removed > 0) {
      parts.push(`Removed from ${removed} client${removed === 1 ? "" : "s"}`);
    }
    if (nothingToRemove > 0) {
      parts.push(`${nothingToRemove} had no entry to remove`);
    }
    if (skipped > 0) {
      parts.push(`${skipped} skipped`);
    }
    if (parts.length > 0) {
      void vscode.window.showInformationMessage(
        `NPM Advisor: ${parts.join(", ")}.${removed > 0 ? " Restart the affected client(s) for the change to take effect." : ""}`,
      );
    }
  });
}

/**
 * Routes a single client to the right uninstall path:
 *  - `json-merge` clients: confirm the file, strip our entries
 *    (current + legacy), back up the prior file, write atomically.
 *    Returns "nothing-to-remove" when our entry isn't present so
 *    the user gets accurate feedback.
 *  - `cli-snippet` clients (Claude Code): copy `claude mcp remove`
 *    to the clipboard.
 */
async function applyRemoval(
  client: McpClientDescriptor,
): Promise<"removed" | "nothing-to-remove" | "skipped" | { error: string }> {
  if (client.strategy.kind === "cli-snippet") {
    const command = buildClaudeCodeRemoveCommand();
    const action = await vscode.window.showInformationMessage(
      `Copy the Claude Code uninstall command to your clipboard? Paste it into a terminal, then restart Claude Code.\n\n${command}`,
      { modal: true },
      "Copy command",
    );
    if (action !== "Copy command") {
      return "skipped";
    }
    await vscode.env.clipboard.writeText(command);
    return "removed";
  }

  const configPath = resolveConfigPath(client.strategy.configPath);
  if (!configPath) {
    return {
      error:
        "Workspace MCP requires an open workspace folder; open a folder and try again.",
    };
  }

  if (!existsSync(configPath)) {
    return "nothing-to-remove";
  }

  const action = await vscode.window.showInformationMessage(
    `Remove the npm-advisor MCP server from ${client.label}?\n\nConfig file: ${configPath}\n\nOther entries are preserved; the previous file is backed up alongside.`,
    { modal: true },
    "Remove",
  );
  if (action !== "Remove") {
    return "skipped";
  }

  try {
    return removeFromConfigFile(configPath, client);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Reads the existing config (treating missing / invalid as nothing
 * to remove), strips every npm-advisor entry from the right map,
 * writes a `.bak` of the prior file, and writes the cleaned
 * version back. When nothing changed, leaves the file untouched
 * and reports back so the wizard can render an accurate summary.
 */
function removeFromConfigFile(
  configPath: string,
  client: McpClientDescriptor,
): "removed" | "nothing-to-remove" {
  let existing: Record<string, unknown> | null = null;
  let originalText: string | null = null;
  try {
    originalText = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(originalText) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      existing = parsed as Record<string, unknown>;
    }
  } catch {
    return "nothing-to-remove";
  }

  const { config, removed } = removeFromExistingConfig(client.id, existing);
  if (!removed) {
    return "nothing-to-remove";
  }

  if (originalText !== null) {
    const backupPath = `${configPath}.${timestamp()}.bak`;
    writeFileSync(backupPath, originalText);
  }
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return "removed";
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
 * user knows exactly what file would be touched (or that no file
 * exists yet); for the CLI-snippet client we explain the snippet
 * flow.
 */
function describeClient(client: McpClientDescriptor): string {
  if (client.strategy.kind === "cli-snippet") {
    return "Copies the `claude mcp remove` command to your clipboard.";
  }
  const resolved = resolveConfigPath(client.strategy.configPath);
  if (!resolved) {
    return `${client.strategy.configPath} (no workspace folder is open right now)`;
  }
  return existsSync(resolved)
    ? `Strips the entry from ${resolved}`
    : `${resolved} (no config file present)`;
}

/**
 * Pre-checks every client whose config file currently exists, so
 * the common "remove from everywhere I installed" case is one
 * confirmation away. CLI-snippet clients stay unchecked because we
 * can't tell whether they have an entry without inspecting the
 * actual CLI's storage.
 */
function defaultPickedFor(client: McpClientDescriptor): boolean {
  if (client.strategy.kind === "cli-snippet") {
    return false;
  }
  const resolved = resolveConfigPath(client.strategy.configPath);
  return resolved ? existsSync(resolved) : false;
}

/** Compact ISO-ish timestamp suitable for embedding in a filename. */
function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
