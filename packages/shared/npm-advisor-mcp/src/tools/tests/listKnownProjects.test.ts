/**
 * External dependencies.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Internal dependencies.
 */
import { runListKnownProjects } from "../listKnownProjects";

/**
 * Re-roots the npm-advisor registry at a temp dir for the test, so
 * we never read or mutate the real shared file. Works by setting
 * XDG_CONFIG_HOME (Linux), HOME (macOS / Windows fallbacks), and
 * APPDATA (Windows) so every code path of getRecentProjectsFilePath
 * lands in the same scratch directory.
 */
function withTempRegistry<T>(
  fn: (writeRegistry: (payload: unknown) => void) => T,
): T {
  const root = mkdtempSync(join(tmpdir(), "npm-advisor-test-"));
  const previousEnv = {
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
    HOME: process.env.HOME,
    APPDATA: process.env.APPDATA,
  };
  process.env.XDG_CONFIG_HOME = root;
  process.env.HOME = root;
  process.env.APPDATA = root;

  const writeRegistry = (payload: unknown): void => {
    const path =
      process.platform === "darwin"
        ? join(
            root,
            "Library",
            "Application Support",
            "npm-advisor",
            "recent-projects.json",
          )
        : process.platform === "win32"
          ? join(root, "npm-advisor", "recent-projects.json")
          : join(root, "npm-advisor", "recent-projects.json");
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, JSON.stringify(payload, null, 2));
  };

  try {
    return fn(writeRegistry);
  } finally {
    rmSync(root, { recursive: true, force: true });
    process.env.XDG_CONFIG_HOME = previousEnv.XDG_CONFIG_HOME;
    if (previousEnv.HOME === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = previousEnv.HOME;
    }
    if (previousEnv.APPDATA === undefined) {
      delete process.env.APPDATA;
    } else {
      process.env.APPDATA = previousEnv.APPDATA;
    }
  }
}

describe("runListKnownProjects", () => {
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it("returns an empty list and hasOpenProjects=false when the registry file is missing", () => {
    withTempRegistry(() => {
      const result = runListKnownProjects();
      expect(result.projects).toEqual([]);
      expect(result.hasOpenProjects).toBe(false);
      expect(result.registryPath).toContain("recent-projects.json");
    });
  });

  it("returns the projects from the registry, currently-open first", () => {
    withTempRegistry((write) => {
      write({
        version: 1,
        projects: [
          {
            absolutePath: "/Users/me/projects/old",
            name: "old",
            lastOpenedAt: "2026-01-01T00:00:00.000Z",
            isCurrentlyOpen: false,
          },
          {
            absolutePath: "/Users/me/projects/active",
            name: "active",
            lastOpenedAt: "2026-02-01T00:00:00.000Z",
            isCurrentlyOpen: true,
          },
        ],
      });
      const result = runListKnownProjects();
      expect(result.projects.map((entry) => entry.absolutePath)).toEqual([
        "/Users/me/projects/active",
        "/Users/me/projects/old",
      ]);
      expect(result.hasOpenProjects).toBe(true);
    });
  });

  it("sorts ties by most-recent lastOpenedAt", () => {
    withTempRegistry((write) => {
      write({
        version: 1,
        projects: [
          {
            absolutePath: "/a",
            name: "a",
            lastOpenedAt: "2026-01-01T00:00:00.000Z",
            isCurrentlyOpen: true,
          },
          {
            absolutePath: "/b",
            name: "b",
            lastOpenedAt: "2026-03-01T00:00:00.000Z",
            isCurrentlyOpen: true,
          },
          {
            absolutePath: "/c",
            name: "c",
            lastOpenedAt: "2026-02-01T00:00:00.000Z",
            isCurrentlyOpen: true,
          },
        ],
      });
      const result = runListKnownProjects();
      expect(result.projects.map((entry) => entry.absolutePath)).toEqual([
        "/b",
        "/c",
        "/a",
      ]);
    });
  });

  it("tolerates a malformed registry by returning an empty list", () => {
    withTempRegistry((write) => {
      write({ this: "is", not: "a", registry: "file" });
      const result = runListKnownProjects();
      expect(result.projects).toEqual([]);
      expect(result.hasOpenProjects).toBe(false);
    });
  });
});
