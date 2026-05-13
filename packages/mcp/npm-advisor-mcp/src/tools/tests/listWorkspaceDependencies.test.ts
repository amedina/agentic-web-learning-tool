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
import { runListWorkspaceDependencies } from "../listWorkspaceDependencies";

/**
 * Allocates a throwaway directory tree for a single test. Paths are
 * realpath-resolved so they compare equal to what node:path returns
 * when the tool runs.
 */
async function withTempDir<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = realpathSync(await mkdtemp(join(tmpdir(), "mcp-list-deps-")));
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

describe("runListWorkspaceDependencies", () => {
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it("auto-ascends from cwd to the monorepo workspace root when no path is given", async () => {
    await withTempDir(async (root) => {
      await writeFile(
        join(root, "pnpm-workspace.yaml"),
        "packages:\n  - 'packages/*'\n",
      );
      await writeJson(join(root, "package.json"), {
        name: "monorepo-root",
        workspaces: ["packages/*"],
      });
      const subPackage = join(root, "packages", "child");
      await mkdir(subPackage, { recursive: true });
      await writeJson(join(subPackage, "package.json"), {
        name: "@scope/child",
        dependencies: { foo: "1.0.0" },
      });
      process.chdir(subPackage);

      const result = await runListWorkspaceDependencies({});

      expect(result.scannedPath).toBe(root);
      expect(result.workspaceRoot).toBeNull();
      const discoveredNames = result.files.map((file) => file.name).sort();
      expect(discoveredNames).toEqual(["@scope/child", "monorepo-root"]);
    });
  });

  it("honours an explicit workspacePath and surfaces the surrounding workspaceRoot", async () => {
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

      const result = await runListWorkspaceDependencies({
        workspacePath: subPackage,
      });

      expect(result.scannedPath).toBe(subPackage);
      expect(result.workspaceRoot).toBe(root);
      expect(result.files.map((file) => file.name)).toEqual(["@scope/child"]);
    });
  });

  it("returns workspaceRoot=null when the explicit path is already the workspace root", async () => {
    await withTempDir(async (root) => {
      await writeFile(
        join(root, "pnpm-workspace.yaml"),
        "packages:\n  - 'packages/*'\n",
      );
      await writeJson(join(root, "package.json"), {
        name: "monorepo-root",
        workspaces: ["packages/*"],
      });
      const subPackage = join(root, "packages", "child");
      await mkdir(subPackage, { recursive: true });
      await writeJson(join(subPackage, "package.json"), {
        name: "@scope/child",
      });

      const result = await runListWorkspaceDependencies({
        workspacePath: root,
      });

      expect(result.scannedPath).toBe(root);
      expect(result.workspaceRoot).toBeNull();
    });
  });

  it("falls back to cwd when no workspace markers exist anywhere above it", async () => {
    await withTempDir(async (root) => {
      const standalone = join(root, "nested", "standalone");
      await mkdir(standalone, { recursive: true });
      await writeJson(join(standalone, "package.json"), {
        name: "standalone",
      });
      process.chdir(standalone);

      const result = await runListWorkspaceDependencies({});

      expect(result.scannedPath).toBe(standalone);
      expect(result.workspaceRoot).toBeNull();
      expect(result.files.map((file) => file.name)).toEqual(["standalone"]);
    });
  });
});
