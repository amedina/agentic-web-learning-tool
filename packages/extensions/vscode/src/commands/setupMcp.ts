/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { McpSetupPanel } from "../mcp/wizard/mcpSetupPanel";

export const SETUP_MCP_COMMAND = "npmAdvisor.setupMcp";

interface SetupMcpDeps {
  extensionUri: vscode.Uri;
}

/**
 * Registers the "Set up MCP for AI clients" command. Opens the MCP
 * setup webview panel — a card-based UI where each supported client
 * (Claude Desktop, Cursor, VSCode workspace MCP, Claude Code) has its
 * own status badge and primary/secondary action buttons. The webview
 * replaces the older multi-select QuickPick: each client is configured
 * independently with no global "select all", inline toasts for
 * results, and direct integrations for the file system (open / reveal
 * the config) and the integrated terminal (run the Claude Code CLI
 * command without copy-paste).
 */
export function registerSetupMcpCommand(deps: SetupMcpDeps): vscode.Disposable {
  return vscode.commands.registerCommand(SETUP_MCP_COMMAND, () => {
    McpSetupPanel.open(deps.extensionUri);
  });
}
