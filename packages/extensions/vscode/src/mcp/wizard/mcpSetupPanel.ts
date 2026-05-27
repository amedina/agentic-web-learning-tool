/**
 * External dependencies.
 */
import * as vscode from "vscode";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Internal dependencies.
 */
import {
  buildClaudeCodeCommand,
  buildClaudeCodeRemoveCommand,
  getSupportedClients,
  type McpClientDescriptor,
  type McpClientId,
} from "../clientConfigs";
import { isProbablyInstalled } from "../clientDetection";
import {
  cleanupBackups,
  getClientStatus,
  installForClient,
  listBackups,
  removeForClient,
  type McpClientStatus,
} from "../operations";
import type {
  McpClientView,
  McpWizardMessage,
  McpWizardRequest,
} from "./protocol";

const VIEW_TYPE = "npmAdvisor.mcpSetupPanel";
const TERMINAL_NAME = "NPM Advisor: MCP setup";

/**
 * Hosts the MCP-setup wizard inside a `vscode.WebviewPanel`. One
 * instance per VSCode window — repeated calls to `open()` reveal the
 * existing panel instead of opening duplicates so the user can't end
 * up with two wizards fighting over the same config files.
 *
 * Responsibilities:
 *  - Builds the React webview HTML (CSP + nonce + bundled script).
 *  - Pushes per-client snapshots (label, description, current status)
 *    to the webview on `ready` and after every action.
 *  - Routes `install` / `remove` / `openConfig` / `revealConfig` /
 *    `runCommand` / `copyCommand` messages back to the right host
 *    primitives (operations module, `vscode.commands`, terminals,
 *    clipboard) and posts an inline `actionResult` toast for the card.
 */
export class McpSetupPanel implements vscode.Disposable {
  private static instance: McpSetupPanel | null = null;

  /**
   * Reveals the existing wizard panel if one is open, otherwise builds
   * a fresh panel and stashes it on the singleton slot. Centralizes
   * the de-dup so callers (the install command, the uninstall command,
   * and any future deeplink) all converge on the same surface.
   */
  static open(extensionUri: vscode.Uri): McpSetupPanel {
    if (McpSetupPanel.instance) {
      McpSetupPanel.instance.panel.reveal();
      return McpSetupPanel.instance;
    }
    const panel = vscode.window.createWebviewPanel(
      VIEW_TYPE,
      "NPM Advisor: MCP Setup",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "dist"),
          vscode.Uri.joinPath(extensionUri, "media"),
        ],
      },
    );
    const instance = new McpSetupPanel(panel, extensionUri);
    McpSetupPanel.instance = instance;
    return instance;
  }

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly subscriptions: vscode.Disposable[] = [];
  private terminal: vscode.Terminal | null = null;

  /**
   * Wires the panel: renders the HTML shell, subscribes to webview
   * messages, sets the icon, and registers a disposal hook so the
   * singleton slot clears when the user closes the tab.
   */
  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.panel.iconPath = vscode.Uri.joinPath(
      extensionUri,
      "media",
      "icon.svg",
    );
    this.panel.webview.html = this.renderHtml();
    this.subscriptions.push(
      this.panel.webview.onDidReceiveMessage((message) => {
        void this.handle(message as McpWizardRequest);
      }),
    );
    this.subscriptions.push(
      this.panel.onDidDispose(() => {
        this.dispose();
      }),
    );
  }

  /** VSCode disposal hook + singleton-slot cleanup. */
  dispose(): void {
    if (McpSetupPanel.instance === this) {
      McpSetupPanel.instance = null;
    }
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }
    this.subscriptions.length = 0;
    this.terminal?.dispose();
    this.terminal = null;
  }

  /**
   * Routes one webview-originated message. Each branch resolves the
   * action and posts back a typed response — `actionResult` for inline
   * toasts plus a `statuses` refresh whenever an action mutated state.
   */
  private async handle(message: McpWizardRequest): Promise<void> {
    switch (message.type) {
      case "ready": {
        this.postInit();
        return;
      }
      case "install": {
        await this.handleInstall(message.clientId);
        return;
      }
      case "remove": {
        await this.handleRemove(message.clientId);
        return;
      }
      case "openConfig": {
        await this.handleOpenConfig(message.clientId);
        return;
      }
      case "revealConfig": {
        await this.handleRevealConfig(message.clientId);
        return;
      }
      case "runCommand": {
        this.handleRunCommand(message.clientId, message.command, message.label);
        return;
      }
      case "copyCommand": {
        await this.handleCopyCommand(message.clientId, message.command);
        return;
      }
      case "viewBackups": {
        await this.handleViewBackups(message.clientId);
        return;
      }
      case "cleanupBackups": {
        this.handleCleanupBackups(message.clientId);
        return;
      }
    }
  }

  /** Pushes the full client snapshot + resolved icon URI to the webview. */
  private postInit(): void {
    const iconUri = this.panel.webview
      .asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, "media", "icon-128-color.png"),
      )
      .toString();
    const message: McpWizardMessage = {
      type: "init",
      clients: this.collectClientViews(),
      iconUri,
    };
    void this.panel.webview.postMessage(message);
  }

  /** Pushes only the per-client status snapshots after an action. */
  private postStatuses(): void {
    const message: McpWizardMessage = {
      type: "statuses",
      clients: this.collectClientViews(),
    };
    void this.panel.webview.postMessage(message);
  }

  /** Pushes a single inline toast routed to one card by clientId. */
  private postActionResult(message: McpWizardMessage): void {
    void this.panel.webview.postMessage(message);
  }

  /**
   * Re-runs the install pipeline for a single client. For json-merge
   * clients this writes the file and pushes a fresh status snapshot;
   * for cli-snippet clients we expect the webview to use `runCommand`
   * or `copyCommand` instead, so this branch returns an explicit error.
   */
  private async handleInstall(clientId: McpClientId): Promise<void> {
    const client = findClient(clientId);
    if (!client) {
      return;
    }
    if (client.strategy.kind === "cli-snippet") {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "install",
          ok: false,
          message:
            "Use Run in terminal or Copy command to register Claude Code.",
        },
      });
      return;
    }
    const result = installForClient(client, this.serverScriptPath());
    if (!result.ok) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "install",
          ok: false,
          message: result.error,
        },
      });
      return;
    }
    this.postStatuses();
    this.postActionResult({
      type: "actionResult",
      result: {
        clientId,
        action: "install",
        ok: true,
        message: `Installed. Restart ${client.label} for the change to take effect.`,
      },
    });
  }

  /**
   * Re-runs the remove pipeline. Distinguishes "removed" from "nothing
   * to remove" so the card's toast is honest about whether anything
   * actually changed.
   */
  private async handleRemove(clientId: McpClientId): Promise<void> {
    const client = findClient(clientId);
    if (!client) {
      return;
    }
    if (client.strategy.kind === "cli-snippet") {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "remove",
          ok: false,
          message:
            "Use Run in terminal or Copy command to remove the entry from Claude Code.",
        },
      });
      return;
    }
    const result = removeForClient(client);
    if (!result.ok) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "remove",
          ok: false,
          message: result.error,
        },
      });
      return;
    }
    this.postStatuses();
    if (result.nothingToDo) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "remove",
          ok: true,
          nothingToDo: true,
          message: "No npm-advisor entry found in this client's config.",
        },
      });
      return;
    }
    this.postActionResult({
      type: "actionResult",
      result: {
        clientId,
        action: "remove",
        ok: true,
        message: `Removed. Restart ${client.label} for the change to take effect.`,
      },
    });
  }

  /**
   * Opens the client's config file in a VSCode editor tab. Creates the
   * file with an empty `{}` stub when it doesn't exist yet so the user
   * lands in a real editor (rather than VSCode's "file not found"
   * dialog) and can hand-edit before a first install. Always posts an
   * actionResult — success or failure — so the card's pending spinner
   * clears.
   */
  private async handleOpenConfig(clientId: McpClientId): Promise<void> {
    const client = findClient(clientId);
    if (!client || client.strategy.kind !== "json-merge") {
      return;
    }
    const status = getClientStatus(client, this.serverScriptPath());
    const configPath = configPathFromStatus(status);
    if (!configPath) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "openConfig",
          ok: false,
          message: statusErrorMessage(status),
        },
      });
      return;
    }
    try {
      if (!existsSync(configPath)) {
        mkdirSync(dirname(configPath), { recursive: true });
        writeFileSync(configPath, "{}\n");
      }
      const uri = vscode.Uri.file(configPath);
      await vscode.commands.executeCommand("vscode.open", uri);
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "openConfig",
          ok: true,
          message: "Opened in editor.",
        },
      });
    } catch (error) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "openConfig",
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Asks the OS file manager to highlight the config file (Finder on
   * macOS, Explorer on Windows). VSCode's `revealFileInOS` fails
   * silently if the file doesn't exist, so we surface a friendly
   * inline error in that case rather than letting the click look
   * broken.
   */
  private async handleRevealConfig(clientId: McpClientId): Promise<void> {
    const client = findClient(clientId);
    if (!client || client.strategy.kind !== "json-merge") {
      return;
    }
    const status = getClientStatus(client, this.serverScriptPath());
    const configPath = configPathFromStatus(status);
    if (!configPath || status.kind === "no-config") {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "revealConfig",
          ok: false,
          message:
            status.kind === "no-config"
              ? "No config file exists yet — install first to create it."
              : statusErrorMessage(status),
        },
      });
      return;
    }
    try {
      const uri = vscode.Uri.file(configPath);
      await vscode.commands.executeCommand("revealFileInOS", uri);
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "revealConfig",
          ok: true,
          message: "Revealed in your file manager.",
        },
      });
    } catch (error) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "revealConfig",
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Opens a fresh integrated terminal and pre-types the given command
   * without auto-executing it. `terminal.sendText(cmd, false)` leaves
   * the cursor at the end of the line so the user can review before
   * pressing Enter.
   *
   * Disposes any prior terminal we created instead of reusing it. The
   * reused-terminal version stacked commands on the input line when
   * the user closed and reopened the wizard's terminal; tearing the
   * old one down means every click lands in a known-empty shell.
   */
  private handleRunCommand(
    clientId: McpClientId,
    command: string,
    label: string,
  ): void {
    this.terminal?.dispose();
    this.terminal = vscode.window.createTerminal({ name: TERMINAL_NAME });
    this.terminal.show();
    this.terminal.sendText(command, false);
    this.postActionResult({
      type: "actionResult",
      result: {
        clientId,
        action: "runCommand",
        ok: true,
        message: `${label} typed into terminal — review and press Enter to run.`,
      },
    });
  }

  /**
   * Reveals the newest backup file for this client in the OS file
   * manager (Finder / Explorer). The user can then browse the prior
   * timestamped backups in the same folder. Refuses with an inline
   * toast if the client has no backups yet so the button doesn't
   * silently fail.
   */
  private async handleViewBackups(clientId: McpClientId): Promise<void> {
    const client = findClient(clientId);
    if (!client) {
      return;
    }
    const { paths } = listBackups(client);
    if (paths.length === 0) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "viewBackups",
          ok: false,
          message: "No backups yet — install or reinstall first.",
        },
      });
      return;
    }
    try {
      const uri = vscode.Uri.file(paths[0]);
      await vscode.commands.executeCommand("revealFileInOS", uri);
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "viewBackups",
          ok: true,
          message: `Opened folder with ${paths.length} backup file${paths.length === 1 ? "" : "s"}.`,
        },
      });
    } catch (error) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "viewBackups",
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Deletes every `.bak` file the wizard has written for this client.
   * The button itself uses a two-click confirm in the React layer
   * (no modal), so by the time we get here the user has already
   * acknowledged the destruction. Posts a status refresh + inline
   * toast so the card's backup count drops to zero.
   */
  private handleCleanupBackups(clientId: McpClientId): void {
    const client = findClient(clientId);
    if (!client) {
      return;
    }
    const { deleted, error } = cleanupBackups(client);
    if (error && deleted === 0) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "cleanupBackups",
          ok: false,
          message: `Couldn't delete backups: ${error}`,
        },
      });
      return;
    }
    this.postStatuses();
    if (deleted === 0) {
      this.postActionResult({
        type: "actionResult",
        result: {
          clientId,
          action: "cleanupBackups",
          ok: true,
          nothingToDo: true,
          message: "No backups to delete.",
        },
      });
      return;
    }
    const tail = error ? ` (one failed: ${error})` : "";
    this.postActionResult({
      type: "actionResult",
      result: {
        clientId,
        action: "cleanupBackups",
        ok: true,
        message: `Deleted ${deleted} backup file${deleted === 1 ? "" : "s"}.${tail}`,
      },
    });
  }

  /** Writes a string to the system clipboard and confirms inline. */
  private async handleCopyCommand(
    clientId: McpClientId,
    command: string,
  ): Promise<void> {
    await vscode.env.clipboard.writeText(command);
    this.postActionResult({
      type: "actionResult",
      result: {
        clientId,
        action: "runCommand",
        ok: true,
        message: "Copied to clipboard.",
      },
    });
  }

  /**
   * Builds a per-client view object for every supported client. Adds
   * Claude Code's CLI install / remove commands to the descriptor so
   * the card's "Run in terminal" / "Copy command" buttons can resolve
   * the string locally without an extra round-trip.
   */
  private collectClientViews(): McpClientView[] {
    const serverScriptPath = this.serverScriptPath();
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
      }
      return view;
    });
  }

  /** Absolute fs path of the bundled MCP server script. */
  private serverScriptPath(): string {
    return vscode.Uri.joinPath(this.extensionUri, "dist", "mcp", "server.js")
      .fsPath;
  }

  /** Builds the wizard's HTML shell — strict CSP, nonce, bundled script. */
  private renderHtml(): string {
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "mcpWizard.js"),
    );
    const styleUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "mcpWizard.css"),
    );
    const nonce = generateNonce();
    const cspSource = this.panel.webview.cspSource;
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${cspSource};"
    />
    <link rel="stylesheet" href="${styleUri}" />
    <title>NPM Advisor: MCP Setup</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

/** Finds a descriptor by id, or returns null when the id is unknown. */
function findClient(clientId: McpClientId): McpClientDescriptor | null {
  return getSupportedClients().find((client) => client.id === clientId) ?? null;
}

/**
 * Pulls the configPath out of an `McpClientStatus` regardless of which
 * variant it is. Centralizes the discriminated-union spread so the
 * panel's open/reveal handlers don't repeat the type narrowing.
 */
function configPathFromStatus(status: McpClientStatus): string | null {
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
function statusErrorMessage(status: McpClientStatus): string {
  if (status.kind === "workspace-required") {
    return "Open a workspace folder first — this client's config lives inside it.";
  }
  if (status.kind === "error") {
    return `Couldn't read config file: ${status.message}`;
  }
  return "Couldn't resolve the config path for this client.";
}

/** Returns a 32-character hex nonce for the webview's script CSP. */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
