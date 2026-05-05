/**
 * External dependencies.
 */
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const MAX_TRACKED_PROJECTS = 50;
const REGISTRY_VERSION = 1;

export interface RecentProjectEntry {
  /** Absolute path to the workspace root the user opened. */
  absolutePath: string;
  /** `name` field from the root package.json, when one was readable. */
  name: string | null;
  /** ISO timestamp the entry was last touched. */
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
 * The same path is computed (independently) by the MCP server, so any
 * MCP-aware AI client can discover the workspaces the user has opened
 * in VSCode without us shipping IPC.
 *
 * Locations follow the platform convention: Application Support on
 * macOS, %APPDATA% on Windows, $XDG_CONFIG_HOME (or ~/.config) on
 * Linux. The directory name `npm-advisor` is the same across both
 * packages so they meet at the same file.
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
 * Reads the registry file from disk, tolerating "file does not exist"
 * (returns an empty list) and "unparseable file" (treated as empty
 * with a console.warn so the user notices a manual edit gone wrong).
 * Never throws — the registry is best-effort context for AI clients,
 * not load-bearing state.
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

/**
 * Persists the registry to disk, creating the parent directory if
 * needed. Sorted by lastOpenedAt descending (newest first) and
 * capped at MAX_TRACKED_PROJECTS so the file doesn't grow without
 * bound across years of use.
 */
export function writeRegistry(projects: RecentProjectEntry[]): void {
  const path = getRecentProjectsFilePath();
  const sorted = [...projects]
    .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))
    .slice(0, MAX_TRACKED_PROJECTS);
  const payload: RegistryFile = {
    version: REGISTRY_VERSION,
    projects: sorted,
  };
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

/**
 * Marks the given workspace folder as currently open. Updates an
 * existing entry's name / open flag / timestamp in place; otherwise
 * appends a new entry. Returns the resulting list so callers can
 * decide whether to write it back (callers should always write).
 */
export function recordProjectOpened(
  registry: RecentProjectEntry[],
  details: { absolutePath: string; name: string | null },
): RecentProjectEntry[] {
  const now = new Date().toISOString();
  const existingIndex = registry.findIndex(
    (entry) => entry.absolutePath === details.absolutePath,
  );
  const updated: RecentProjectEntry = {
    absolutePath: details.absolutePath,
    name: details.name,
    lastOpenedAt: now,
    isCurrentlyOpen: true,
  };
  if (existingIndex === -1) {
    return [...registry, updated];
  }
  const next = [...registry];
  next[existingIndex] = updated;
  return next;
}

/**
 * Marks a workspace folder as no longer open without deleting the
 * entry — keeps the project visible to AI clients as a recently-used
 * choice, just with `isCurrentlyOpen: false`. Used on extension
 * deactivation and when a workspace folder is removed from the
 * window.
 */
export function recordProjectClosed(
  registry: RecentProjectEntry[],
  absolutePath: string,
): RecentProjectEntry[] {
  return registry.map((entry) =>
    entry.absolutePath === absolutePath
      ? { ...entry, isCurrentlyOpen: false }
      : entry,
  );
}

/**
 * Marks every entry in the registry closed. Used when the extension
 * deactivates so a stale "isCurrentlyOpen: true" doesn't survive a
 * VSCode crash.
 */
export function recordAllProjectsClosed(
  registry: RecentProjectEntry[],
): RecentProjectEntry[] {
  return registry.map((entry) => ({ ...entry, isCurrentlyOpen: false }));
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
