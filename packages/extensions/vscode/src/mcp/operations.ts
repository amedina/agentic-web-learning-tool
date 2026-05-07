/**
 * External dependencies.
 */
import * as vscode from "vscode";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

/**
 * Internal dependencies.
 */
import {
  buildJsonMergePayload,
  buildServerEntry,
  mergeIntoExistingConfig,
  removeFromExistingConfig,
  SERVER_KEY_NAME,
  type McpClientDescriptor,
} from "./clientConfigs";

/**
 * Status of a single MCP client at a point in time. The wizard UI uses
 * this to pick which buttons to show ("Install" vs "Reinstall" vs
 * "Remove") and what badge to render.
 *
 * - `installed`: our entry is present and points at the current
 *   serverScriptPath.
 * - `installed-stale`: our entry is present but points at a different
 *   path (e.g. a previous extension version's server.js); the user
 *   probably wants to "Reinstall" to update the path.
 * - `not-installed`: the file is parseable but has no entry of ours.
 * - `no-config`: the file does not exist yet.
 * - `workspace-required`: the client needs a workspace folder open
 *   (currently only VSCode workspace MCP) and there isn't one.
 * - `cli-snippet`: the client uses a CLI command — we can't introspect
 *   its registry without invoking the CLI, so we leave detection to
 *   the user.
 * - `error`: the file exists but is unreadable / unparseable.
 */
export type McpClientStatus =
  | { kind: "installed"; configPath: string }
  | { kind: "installed-stale"; configPath: string; currentPath: string }
  | { kind: "not-installed"; configPath: string }
  | { kind: "no-config"; configPath: string }
  | { kind: "workspace-required" }
  | { kind: "cli-snippet" }
  | { kind: "error"; configPath: string; message: string };

/**
 * Result of an install / remove operation. The wizard UI surfaces the
 * `error` string inline on the client's card, so it must be safe to
 * render verbatim.
 */
export type McpOperationResult =
  | { ok: true; nothingToDo?: boolean }
  | { ok: false; error: string };

/**
 * Inspects the on-disk config for the given client and reports back
 * what state it's in, so the wizard can render an accurate status
 * badge and pick the right primary action. Pure read; never writes.
 */
export function getClientStatus(
  client: McpClientDescriptor,
  serverScriptPath: string,
): McpClientStatus {
  if (client.strategy.kind === "cli-snippet") {
    return { kind: "cli-snippet" };
  }
  const configPath = resolveConfigPath(client.strategy.configPath);
  if (!configPath) {
    return { kind: "workspace-required" };
  }
  if (!existsSync(configPath)) {
    return { kind: "no-config", configPath };
  }
  let parsed: Record<string, unknown> | null = null;
  try {
    const text = readFileSync(configPath, "utf8");
    const value = JSON.parse(text) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      parsed = value as Record<string, unknown>;
    }
  } catch (error) {
    return {
      kind: "error",
      configPath,
      message: error instanceof Error ? error.message : String(error),
    };
  }
  if (!parsed) {
    return { kind: "not-installed", configPath };
  }
  const mapKey = client.id === "vscode" ? "servers" : "mcpServers";
  const map = parsed[mapKey];
  if (!map || typeof map !== "object" || Array.isArray(map)) {
    return { kind: "not-installed", configPath };
  }
  const entry = (map as Record<string, unknown>)[SERVER_KEY_NAME];
  if (!entry || typeof entry !== "object") {
    return { kind: "not-installed", configPath };
  }
  const installedPath = extractServerPath(entry as Record<string, unknown>);
  if (installedPath && installedPath === serverScriptPath) {
    return { kind: "installed", configPath };
  }
  return {
    kind: "installed-stale",
    configPath,
    currentPath: installedPath ?? "",
  };
}

/**
 * Writes the npm-advisor entry into the client's config file. Reuses
 * the merge logic in clientConfigs.ts (so legacy keys get cleaned and
 * other entries are preserved) and writes a timestamped `.bak` of any
 * pre-existing file before overwriting.
 *
 * Skipped (no-op) for cli-snippet clients — they go through a
 * different surface (terminal / clipboard) handled by the caller.
 */
export function installForClient(
  client: McpClientDescriptor,
  serverScriptPath: string,
): McpOperationResult {
  if (client.strategy.kind === "cli-snippet") {
    return { ok: false, error: "cli-snippet clients install via terminal" };
  }
  const configPath = resolveConfigPath(client.strategy.configPath);
  if (!configPath) {
    return {
      ok: false,
      error:
        "Workspace MCP requires an open workspace folder; open a folder and try again.",
    };
  }
  try {
    writeMergedConfig(configPath, client, serverScriptPath);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Strips every npm-advisor entry (current + legacy keys) from the
 * client's config file. Returns `nothingToDo: true` when our entry
 * isn't present so the caller can render an accurate "nothing to
 * remove" state instead of a misleading success.
 */
export function removeForClient(
  client: McpClientDescriptor,
): McpOperationResult {
  if (client.strategy.kind === "cli-snippet") {
    return { ok: false, error: "cli-snippet clients remove via terminal" };
  }
  const configPath = resolveConfigPath(client.strategy.configPath);
  if (!configPath) {
    return {
      ok: false,
      error:
        "Workspace MCP requires an open workspace folder; open a folder and try again.",
    };
  }
  if (!existsSync(configPath)) {
    return { ok: true, nothingToDo: true };
  }
  try {
    const result = removeFromConfigFile(configPath, client);
    return { ok: true, nothingToDo: !result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Lists every timestamped backup file the wizard has written for the
 * given client's config, sorted newest-first (lexicographic sort
 * works because the timestamps embedded in the filename are ISO
 * strings). Returns absolute paths. An empty array means the
 * directory has no backups for this config — including the case
 * where the config file itself doesn't exist yet, since we never
 * write a backup without a prior file to back up.
 */
export function listBackups(client: McpClientDescriptor): {
  paths: string[];
  configPath: string | null;
} {
  if (client.strategy.kind === "cli-snippet") {
    return { paths: [], configPath: null };
  }
  const configPath = resolveConfigPath(client.strategy.configPath);
  if (!configPath) {
    return { paths: [], configPath: null };
  }
  const directory = dirname(configPath);
  if (!existsSync(directory)) {
    return { paths: [], configPath };
  }
  const fileBasename = basename(configPath);
  // The wizard writes ${configPath}.${ISO-ish-timestamp}.bak; match
  // exactly that shape so unrelated `.bak` files in the same
  // directory (other tools' backups, the user's manual backups,
  // etc.) don't get listed or — much worse — deleted by cleanup.
  const pattern = new RegExp(`^${escapeRegExp(fileBasename)}\\..+\\.bak$`);
  let entries: string[];
  try {
    entries = readdirSync(directory);
  } catch {
    return { paths: [], configPath };
  }
  const matches = entries
    .filter((name) => pattern.test(name))
    .sort()
    .reverse()
    .map((name) => join(directory, name));
  return { paths: matches, configPath };
}

/**
 * Deletes every backup file `listBackups` would return for the given
 * client. Returns the count actually removed plus an `error` string
 * describing the first failure so the caller can surface it inline.
 * Does not touch the live config file — only files matching the
 * `<config>.<timestamp>.bak` shape we wrote ourselves.
 */
export function cleanupBackups(client: McpClientDescriptor): {
  deleted: number;
  error?: string;
} {
  const { paths } = listBackups(client);
  let deleted = 0;
  let firstError: string | null = null;
  for (const path of paths) {
    try {
      unlinkSync(path);
      deleted += 1;
    } catch (error) {
      if (!firstError) {
        firstError = error instanceof Error ? error.message : String(error);
      }
    }
  }
  return firstError ? { deleted, error: firstError } : { deleted };
}

/**
 * Escapes a string so it can be embedded literally inside a RegExp.
 * Used by listBackups to match the per-client config filename
 * exactly (e.g., `claude_desktop_config.json` has a literal dot that
 * must not match any character).
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolves the configured path for a json-merge client to an absolute
 * path on disk. Workspace-relative paths (`.vscode/mcp.json`) anchor
 * against the first workspace folder; absolute paths are returned as-is.
 * Returns null when a relative path is configured and no workspace
 * folder is open.
 */
export function resolveConfigPath(rawPath: string): string | null {
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
 * Extracts the server script path from an existing MCP entry's `args`
 * array, so callers can compare it against the bundled server path
 * and decide whether the entry is current or stale. Returns null when
 * the entry shape doesn't match what we write.
 */
function extractServerPath(entry: Record<string, unknown>): string | null {
  const args = entry.args;
  if (!Array.isArray(args)) {
    return null;
  }
  const first = args[0];
  return typeof first === "string" ? first : null;
}

/**
 * Reads the existing config (treating missing / empty / invalid as
 * "no prior config"), merges our server entry in, writes a `.bak` with
 * the prior contents when one existed, then atomically replaces the
 * live file. The .bak suffix is timestamped so repeated runs don't
 * overwrite earlier backups.
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
 * Removes every npm-advisor entry from the existing config (current +
 * legacy keys), backs up the prior contents, and writes the cleaned
 * version back. Returns true when something was actually stripped so
 * the caller can distinguish "removed" from "nothing to remove".
 */
function removeFromConfigFile(
  configPath: string,
  client: McpClientDescriptor,
): boolean {
  let existing: Record<string, unknown> | null = null;
  let originalText: string | null = null;
  try {
    originalText = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(originalText) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      existing = parsed as Record<string, unknown>;
    }
  } catch {
    return false;
  }

  const { config, removed } = removeFromExistingConfig(client.id, existing);
  if (!removed) {
    return false;
  }

  if (originalText !== null) {
    const backupPath = `${configPath}.${timestamp()}.bak`;
    writeFileSync(backupPath, originalText);
  }
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return true;
}

/** Compact ISO-ish timestamp suitable for embedding in a filename. */
function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
