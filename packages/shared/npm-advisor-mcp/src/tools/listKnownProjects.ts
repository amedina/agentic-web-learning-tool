/**
 * Internal dependencies.
 */
import {
  getRecentProjectsFilePath,
  readRegistry,
  type RecentProjectEntry,
} from "../lib/recentProjectsRegistry.ts";

export interface ListKnownProjectsOutput {
  /**
   * Absolute path of the file the registry was loaded from. Surfaces
   * up to MCP clients in case the user wants to inspect or hand-edit
   * it (or so a debugger can confirm we're reading the right file).
   */
  registryPath: string;
  /**
   * Every workspace folder the VSCode extension has tracked, sorted
   * with currently-open projects first, then by most-recent open
   * time. Empty when the user hasn't installed / activated the
   * VSCode extension yet.
   */
  projects: RecentProjectEntry[];
  /** True when at least one tracked workspace is currently open in VSCode. */
  hasOpenProjects: boolean;
}

/**
 * Tool handler for `list_known_projects`. Reads the shared
 * recent-projects registry that the VSCode extension keeps in sync
 * and returns its contents to the MCP client. Currently-open
 * projects float to the top so an AI client can confidently say
 * "you have one project open in VSCode — let's look at that" or
 * "you have three; which one?".
 */
export function runListKnownProjects(): ListKnownProjectsOutput {
  const projects = readRegistry();
  const sorted = [...projects].sort((a, b) => {
    if (a.isCurrentlyOpen !== b.isCurrentlyOpen) {
      return a.isCurrentlyOpen ? -1 : 1;
    }
    return b.lastOpenedAt.localeCompare(a.lastOpenedAt);
  });
  return {
    registryPath: getRecentProjectsFilePath(),
    projects: sorted,
    hasOpenProjects: sorted.some((entry) => entry.isCurrentlyOpen),
  };
}
