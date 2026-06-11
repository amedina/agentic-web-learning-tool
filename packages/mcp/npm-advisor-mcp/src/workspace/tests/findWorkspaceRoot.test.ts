/**
 * External dependencies.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Internal dependencies.
 */
import { findWorkspaceRoot } from "../findWorkspaceRoot";

/**
 * Allocates a throwaway directory tree for a single test. The temp
 * path is realpath-resolved so we can compare it byte-for-byte with
 * the path findWorkspaceRoot returns (which is also realpath via
 * node:path.resolve).
 */
async function withTempDir<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = realpathSync(await mkdtemp(join(tmpdir(), "mcp-root-")));
  try {
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

/**
 * Writes a JSON file at the given path, creating parent directories
 * as needed.
 */
async function writeJson(filePath: string, payload: unknown): Promise<void> {
  await mkdir(join(filePath, ".."), { recursive: true });
  await writeFile(filePath, JSON.stringify(payload, null, 2));
}

describe("findWorkspaceRoot", () => {
  let cleanup: Array<() => Promise<void>>;

  beforeEach(() => {
    cleanup = [];
  });

  afterEach(async () => {
    for (const cleanupTask of cleanup) {
      await cleanupTask();
    }
  });

  it("returns the directory when it contains pnpm-workspace.yaml", async () => {
    await withTempDir(async (root) => {
      await writeFile(
        join(root, "pnpm-workspace.yaml"),
        "packages:\n  - 'packages/*'\n",
      );
      const result = await findWorkspaceRoot(root);
      expect(result).toBe(root);
    });
  });

  it("returns the directory when package.json has a workspaces array", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "package.json"), {
        name: "monorepo",
        workspaces: ["packages/*"],
      });
      const result = await findWorkspaceRoot(root);
      expect(result).toBe(root);
    });
  });

  it("accepts the yarn-nohoist object form of `workspaces`", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "package.json"), {
        name: "monorepo",
        workspaces: { packages: ["packages/*"], nohoist: ["**/foo"] },
      });
      const result = await findWorkspaceRoot(root);
      expect(result).toBe(root);
    });
  });

  it("ascends from a sub-package to the workspace root", async () => {
    await withTempDir(async (root) => {
      await writeFile(
        join(root, "pnpm-workspace.yaml"),
        "packages:\n  - 'packages/*'\n",
      );
      const subPackage = join(root, "packages", "child");
      await mkdir(subPackage, { recursive: true });
      await writeJson(join(subPackage, "package.json"), {
        name: "@scope/child",
      });
      const result = await findWorkspaceRoot(subPackage);
      expect(result).toBe(root);
    });
  });

  it("returns null when no marker is found before the filesystem root", async () => {
    await withTempDir(async (root) => {
      const isolated = join(root, "nested", "project");
      await mkdir(isolated, { recursive: true });
      await writeJson(join(isolated, "package.json"), { name: "standalone" });
      const result = await findWorkspaceRoot(isolated);
      expect(result).toBeNull();
    });
  });

  it("ignores a package.json with workspaces field of the wrong shape", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "package.json"), {
        name: "not-a-workspace",
        workspaces: "this is a string, not a list",
      });
      const result = await findWorkspaceRoot(root);
      expect(result).toBeNull();
    });
  });
});
