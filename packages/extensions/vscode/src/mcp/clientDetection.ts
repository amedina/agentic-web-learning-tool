/**
 * External dependencies.
 */
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { delimiter, join } from "node:path";

/**
 * Internal dependencies.
 */
import type {
  McpClientDescriptor,
  McpClientInstallHint,
} from "./clientConfigs";

/**
 * Returns true when the client looks installed on this machine. The
 * wizard hides clients that don't match unless the user opts into
 * "Show all supported clients", so the goal here is to err on the
 * side of including a client when any of its hints resolves.
 *
 * A descriptor without hints (or with an empty list) is treated as
 * always-installed — use that for the editor the extension is
 * running inside (VSCode workspace MCP).
 */
export function isProbablyInstalled(client: McpClientDescriptor): boolean {
  const hints = client.installedHints;
  if (!hints || hints.length === 0) {
    return true;
  }
  return hints.some(hintMatches);
}

/**
 * Resolves a single install hint to a boolean. Splits the two kinds
 * out so we can grow either side independently (e.g. add a
 * brew-cask hint without touching the path-existence path).
 */
function hintMatches(hint: McpClientInstallHint): boolean {
  if (hint.kind === "path") {
    return existsSync(hint.path);
  }
  if (hint.kind === "command") {
    return commandExistsOnPath(hint.name);
  }
  return false;
}

/**
 * Walks every entry on PATH looking for `name` (plus the Windows
 * executable suffixes). Avoids spawning a child process so the check
 * stays cheap to call repeatedly during wizard re-renders. Returns
 * true on the first match.
 */
function commandExistsOnPath(name: string): boolean {
  const path = process.env.PATH;
  if (!path) {
    return false;
  }
  const directories = path
    .split(delimiter)
    .filter((segment) => segment.length > 0);
  const suffixes = platform() === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
  for (const directory of directories) {
    for (const suffix of suffixes) {
      if (existsSync(join(directory, name + suffix))) {
        return true;
      }
    }
  }
  return false;
}
