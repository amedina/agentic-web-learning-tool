/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { McpSetupPanel } from "../mcp/wizard/mcpSetupPanel";

export const UNINSTALL_MCP_COMMAND = "npmAdvisor.uninstallMcp";

interface UninstallMcpDeps {
  extensionUri: vscode.Uri;
}

/**
 * Registers the "Remove MCP server from AI clients" command. Opens
 * the same MCP-setup webview panel as the install command — uninstall
 * is now a per-client button on each card rather than a separate
 * wizard, so we don't have two parallel QuickPick flows the user has
 * to disambiguate. Kept as a separate command for discoverability
 * from the command palette.
 */
export function registerUninstallMcpCommand(
  deps: UninstallMcpDeps,
): vscode.Disposable {
  return vscode.commands.registerCommand(UNINSTALL_MCP_COMMAND, () => {
    McpSetupPanel.open(deps.extensionUri);
  });
}
