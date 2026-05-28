/**
 * External dependencies.
 */
import { homedir, platform } from "node:os";
import { join } from "node:path";

export type McpClientId =
  | "claude-desktop"
  | "cursor"
  | "vscode"
  | "claude-code"
  | "windsurf";

export type McpClientStrategy =
  /** Direct merge into a JSON config file we own (Claude Desktop / Cursor / VSCode native MCP). */
  | { kind: "json-merge"; configPath: string }
  /** Show a copy-able CLI command (Claude Code uses `claude mcp add ...`). */
  | { kind: "cli-snippet" };

/**
 * A single signal that suggests the client is installed on the
 * user's machine. The wizard hides cards whose descriptor lists
 * hints but where none of them match, so populate with conservative
 * choices (app bundle path, config directory) to avoid false negatives.
 *
 * - `path` — checks `existsSync(path)`. Use the app bundle on macOS,
 *   the install dir on Windows, or the config dir on any platform.
 * - `command` — scans PATH for the named executable (with Windows
 *   suffixes appended). Use for CLI clients like Claude Code.
 */
export type McpClientInstallHint =
  | { kind: "path"; path: string }
  | { kind: "command"; name: string };

export interface McpClientDescriptor {
  id: McpClientId;
  /** Human-readable name shown in the QuickPick. */
  label: string;
  /** Short tagline shown under the label. */
  description: string;
  /** Optional learn-more URL surfaced in the wizard. */
  docsUrl?: string;
  strategy: McpClientStrategy;
  /**
   * Filesystem / PATH signals that the client is installed on this
   * machine. Any one resolving counts. Omit (or leave empty) to mean
   * "always show" — appropriate for the editor we're hosted in.
   */
  installedHints?: McpClientInstallHint[];
}

// Claude Desktop's Connectors UI throws "Invalid server ID format.
// Expected UUID or mcpsrv_* tagged ID" when you click Disconnect on
// any stdio MCP server added via a direct edit to
// claude_desktop_config.json. We've now confirmed that the format
// error is misleading — the UI rejects every key shape we've tried:
//
//   - `npm-advisor`              — rejected
//   - `mcpsrv_npm_advisor`        — rejected
//   - `mcpsrv_<v4-uuid>`          — also rejected
//
// So the underlying limitation isn't the key format; Claude Desktop's
// Connectors UI is wired only to entries it owns through its own
// installer flow, and disconnect for config-file servers is a no-op
// regardless. Trying to satisfy the regex with a UUID-style key just
// makes our entry uglier in `claude mcp list` and the user's config
// file without buying anything.
//
// Reverted to the readable `npm-advisor` name. Uninstall is handled
// by our own wizard (the Remove button on each card), not Claude
// Desktop's Connectors UI.
const SERVER_KEY = "npm-advisor";

/**
 * Pre-migration keys — used by the wizard's install + uninstall paths
 * to clean up entries written under earlier names. Add to this list
 * (don't remove from it) every time SERVER_KEY changes so reinstalls
 * always end up with exactly one entry across all of npm-advisor's
 * historical names. Keeps `mcpsrv_npm_advisor` (early attempt to
 * satisfy Claude Desktop's regex) and the UUID-prefixed key (a
 * second attempt with a v4 UUID) so anyone whose config still
 * carries those names gets cleaned up automatically on next install.
 */
const LEGACY_SERVER_KEYS = [
  "mcpsrv_npm_advisor",
  "mcpsrv_ec050486-7167-4ee0-a12c-996bf7aa5dda",
] as const;

/**
 * Returns the canonical descriptor for every supported MCP client.
 * Paths use the user's home dir + the per-client well-known config
 * location for the running platform; clients without a JSON config
 * (Claude Code) fall through to a CLI-snippet strategy so we don't
 * try to outguess their merge semantics.
 */
export function getSupportedClients(): McpClientDescriptor[] {
  const home = homedir();
  const isWindows = platform() === "win32";
  const isMac = platform() === "darwin";

  const claudeDesktopConfig = isMac
    ? join(
        home,
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json",
      )
    : isWindows
      ? join(
          process.env.APPDATA ?? join(home, "AppData", "Roaming"),
          "Claude",
          "claude_desktop_config.json",
        )
      : join(home, ".config", "Claude", "claude_desktop_config.json");

  const claudeDesktopHints: McpClientInstallHint[] = isMac
    ? [
        { kind: "path", path: "/Applications/Claude.app" },
        {
          kind: "path",
          path: join(home, "Library", "Application Support", "Claude"),
        },
      ]
    : isWindows
      ? [
          {
            kind: "path",
            path: join(
              process.env.LOCALAPPDATA ?? join(home, "AppData", "Local"),
              "AnthropicClaude",
            ),
          },
          {
            kind: "path",
            path: join(
              process.env.APPDATA ?? join(home, "AppData", "Roaming"),
              "Claude",
            ),
          },
        ]
      : [{ kind: "path", path: join(home, ".config", "Claude") }];

  const cursorHints: McpClientInstallHint[] = isMac
    ? [
        { kind: "path", path: "/Applications/Cursor.app" },
        { kind: "path", path: join(home, ".cursor") },
      ]
    : isWindows
      ? [
          {
            kind: "path",
            path: join(
              process.env.LOCALAPPDATA ?? join(home, "AppData", "Local"),
              "Programs",
              "cursor",
            ),
          },
          { kind: "path", path: join(home, ".cursor") },
        ]
      : [{ kind: "path", path: join(home, ".cursor") }];

  const windsurfConfig = join(home, ".codeium", "windsurf", "mcp_config.json");
  const windsurfHints: McpClientInstallHint[] = isMac
    ? [
        { kind: "path", path: "/Applications/Windsurf.app" },
        { kind: "path", path: join(home, ".codeium", "windsurf") },
      ]
    : isWindows
      ? [
          {
            kind: "path",
            path: join(
              process.env.LOCALAPPDATA ?? join(home, "AppData", "Local"),
              "Programs",
              "Windsurf",
            ),
          },
          { kind: "path", path: join(home, ".codeium", "windsurf") },
        ]
      : [{ kind: "path", path: join(home, ".codeium", "windsurf") }];

  return [
    {
      id: "claude-code",
      label: "Claude Code",
      description: "Anthropic's CLI agent — registers via `claude mcp add`",
      docsUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp",
      strategy: { kind: "cli-snippet" },
      installedHints: [{ kind: "command", name: "claude" }],
    },
    {
      id: "claude-desktop",
      label: "Claude Desktop",
      description: "Anthropic's desktop chat app",
      docsUrl: "https://modelcontextprotocol.io/quickstart/user",
      strategy: { kind: "json-merge", configPath: claudeDesktopConfig },
      installedHints: claudeDesktopHints,
    },
    {
      id: "cursor",
      label: "Cursor",
      description: "AI-first code editor",
      docsUrl: "https://docs.cursor.com/context/model-context-protocol",
      strategy: {
        kind: "json-merge",
        configPath: join(home, ".cursor", "mcp.json"),
      },
      installedHints: cursorHints,
    },
    {
      id: "vscode",
      label: "VSCode (workspace MCP)",
      description:
        "Adds the server to your workspace's .vscode/mcp.json (used by Copilot agent mode)",
      docsUrl: "https://code.visualstudio.com/docs/copilot/chat/mcp-servers",
      strategy: { kind: "json-merge", configPath: ".vscode/mcp.json" },
      // No installedHints — we are VSCode, so it's always present.
    },
    {
      id: "windsurf",
      label: "Windsurf",
      description: "Codeium's agentic IDE",
      docsUrl: "https://docs.windsurf.com/windsurf/cascade/mcp",
      strategy: { kind: "json-merge", configPath: windsurfConfig },
      installedHints: windsurfHints,
    },
  ];
}

export interface McpServerEntry {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Builds the JSON entry every json-merge client gets. Path is
 * absolute so the entry keeps working regardless of which directory
 * the client launches the server from. `node` is the launcher (every
 * supported client ships a Node runtime alongside or expects one on
 * the system).
 */
export function buildServerEntry(serverScriptPath: string): McpServerEntry {
  return {
    command: "node",
    args: [serverScriptPath],
  };
}

/**
 * Builds the `claude mcp add` invocation for the Claude-Code path.
 * Quotes the script path so a space in the install location (which
 * is common on macOS and Windows when extensions live under a path
 * with the user's display name) doesn't break the shell.
 */
export function buildClaudeCodeCommand(serverScriptPath: string): string {
  return `claude mcp add ${SERVER_KEY} -- node "${serverScriptPath}"`;
}

/**
 * Reshapes an MCP server entry into the per-client JSON envelope the
 * client expects. Most clients nest server entries under a top-level
 * `mcpServers` object; VSCode's native MCP file uses `servers` instead.
 * Returning the full file shape (rather than just the entry) keeps
 * the merge logic in one place.
 */
export function buildJsonMergePayload(
  clientId: McpClientId,
  entry: McpServerEntry,
): Record<string, unknown> {
  if (clientId === "vscode") {
    return { servers: { [SERVER_KEY]: entry } };
  }
  return { mcpServers: { [SERVER_KEY]: entry } };
}

/**
 * Merges our server entry into a user's existing config object,
 * preserving every other key the user already has set (other MCP
 * servers, top-level settings, comments-stripped JSON, etc.). The
 * `mcpServers` / `servers` map is created when missing. Legacy
 * `npm-advisor` entries from earlier installs are stripped so the
 * client doesn't end up with two registrations of the same server
 * — important for Claude Desktop, whose management UI rejects the
 * legacy key shape.
 */
export function mergeIntoExistingConfig(
  clientId: McpClientId,
  existing: Record<string, unknown> | null,
  entry: McpServerEntry,
): Record<string, unknown> {
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  const mapKey = clientId === "vscode" ? "servers" : "mcpServers";
  const existingMap =
    base[mapKey] &&
    typeof base[mapKey] === "object" &&
    !Array.isArray(base[mapKey])
      ? (base[mapKey] as Record<string, unknown>)
      : {};
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(existingMap)) {
    if ((LEGACY_SERVER_KEYS as readonly string[]).includes(key)) {
      continue;
    }
    cleaned[key] = value;
  }
  cleaned[SERVER_KEY] = entry;
  base[mapKey] = cleaned;
  return base;
}

/**
 * Removes our server entry (current + every legacy name) from a
 * user's existing config object. Returns the new config plus a flag
 * indicating whether anything was actually removed, so the caller
 * can show a "nothing to uninstall" message instead of writing an
 * unchanged file. Empty `mcpServers` / `servers` maps are left in
 * place because the user may want to keep their other entries
 * intact even if we're the only one we manage.
 */
export function removeFromExistingConfig(
  clientId: McpClientId,
  existing: Record<string, unknown> | null,
): { config: Record<string, unknown>; removed: boolean } {
  const base: Record<string, unknown> = existing ? { ...existing } : {};
  const mapKey = clientId === "vscode" ? "servers" : "mcpServers";
  const existingMap =
    base[mapKey] &&
    typeof base[mapKey] === "object" &&
    !Array.isArray(base[mapKey])
      ? (base[mapKey] as Record<string, unknown>)
      : null;
  if (!existingMap) {
    return { config: base, removed: false };
  }
  const obsoleteKeys = new Set<string>([SERVER_KEY, ...LEGACY_SERVER_KEYS]);
  let removed = false;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(existingMap)) {
    if (obsoleteKeys.has(key)) {
      removed = true;
      continue;
    }
    cleaned[key] = value;
  }
  base[mapKey] = cleaned;
  return { config: base, removed };
}

/**
 * Builds the `claude mcp remove` invocation Claude Code users paste
 * into a terminal. Mirrors buildClaudeCodeCommand for the install
 * path so the wizard's two flows look symmetric.
 */
export function buildClaudeCodeRemoveCommand(): string {
  return `claude mcp remove ${SERVER_KEY}`;
}

/** Server key written into every json-merge client's config — useful for tests. */
export const SERVER_KEY_NAME = SERVER_KEY;

/** Legacy keys we clean up alongside SERVER_KEY — exposed for tests. */
export const LEGACY_SERVER_KEY_NAMES = LEGACY_SERVER_KEYS;
