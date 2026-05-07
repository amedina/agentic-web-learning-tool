/**
 * External dependencies.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

export interface RecentProjectEntry {
  /** Absolute path to the workspace root the user opened in VSCode. */
  absolutePath: string;
  /** `name` field from the workspace's root package.json, when readable. */
  name: string | null;
  /** ISO timestamp the entry was last touched by the VSCode extension. */
  lastOpenedAt: string;
  /** True when a VSCode window with this folder open is currently alive. */
  isCurrentlyOpen: boolean;
}

interface RegistryFile {
  version: number;
  projects: RecentProjectEntry[];
}

/**
 * Returns the OS-specific path of the shared recent-projects file.
 *
 * Mirrors `getRecentProjectsFilePath()` in the VSCode extension —
 * the two packages are independent but agree on the same well-known
 * filesystem location so the extension's writes are visible to the
 * MCP server's reads.
 */
export function getRecentProjectsFilePath(): string {
  const home = homedir();
  if (platform() === "darwin") {
    return join(
      home,
      "Library",
      "Application Support",
      "npm-advisor",
      "recent-projects.json",
    );
  }
  if (platform() === "win32") {
    const appData = process.env.APPDATA ?? join(home, "AppData", "Roaming");
    return join(appData, "npm-advisor", "recent-projects.json");
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? join(home, ".config");
  return join(xdg, "npm-advisor", "recent-projects.json");
}

/**
 * Reads the registry file from disk. Returns an empty list when the
 * file is missing (the user hasn't installed / activated the VSCode
 * extension) or unparseable. Never throws.
 */
export function readRegistry(): RecentProjectEntry[] {
  const path = getRecentProjectsFilePath();
  if (!existsSync(path)) {
    return [];
  }
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as RegistryFile;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.projects)
    ) {
      return [];
    }
    return parsed.projects.filter(isProjectEntry);
  } catch {
    return [];
  }
}

/** Type-guard so we never load garbage from a hand-edited registry file. */
function isProjectEntry(value: unknown): value is RecentProjectEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<RecentProjectEntry>;
  return (
    typeof candidate.absolutePath === "string" &&
    typeof candidate.lastOpenedAt === "string" &&
    typeof candidate.isCurrentlyOpen === "boolean"
  );
}
