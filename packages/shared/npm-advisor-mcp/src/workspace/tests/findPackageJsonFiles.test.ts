/**
 * External dependencies.
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Internal dependencies.
 */
import {
  findPackageJsonFiles,
  readPackageJsonDependencies,
} from "../findPackageJsonFiles";

/** Builds a throwaway directory tree for a single test. */
async function withTempDir<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = await mkdtemp(join(tmpdir(), "mcp-test-"));
  try {
    return await fn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

/** Writes a JSON file at the given path, creating parent directories as needed. */
async function writeJson(filePath: string, payload: unknown): Promise<void> {
  await mkdir(join(filePath, ".."), { recursive: true });
  await writeFile(filePath, JSON.stringify(payload, null, 2));
}

describe("findPackageJsonFiles", () => {
  let cleanup: Array<() => Promise<void>>;

  beforeEach(() => {
    cleanup = [];
  });

  afterEach(async () => {
    await Promise.all(cleanup.map((fn) => fn()));
  });

  it("returns the root package.json when one exists", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "package.json"), {
        name: "rootpkg",
        dependencies: { lodash: "^4.0.0" },
      });
      const result = await findPackageJsonFiles(root);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        absolutePath: join(root, "package.json"),
        relativePath: "package.json",
        name: "rootpkg",
        dependencyCounts: {
          dependencies: 1,
          devDependencies: 0,
          peerDependencies: 0,
          optionalDependencies: 0,
        },
      });
    });
  });

  it("walks subdirectories and reports relative paths sorted", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "packages/a/package.json"), { name: "a" });
      await writeJson(join(root, "packages/b/package.json"), { name: "b" });
      await writeJson(join(root, "packages/sub/c/package.json"), {
        name: "c",
      });
      const result = await findPackageJsonFiles(root);
      expect(result.map((entry) => entry.relativePath)).toEqual([
        "packages/a/package.json",
        "packages/b/package.json",
        "packages/sub/c/package.json",
      ]);
    });
  });

  it("skips node_modules and other build / dependency directories", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "package.json"), { name: "root" });
      await writeJson(join(root, "node_modules/foo/package.json"), {
        name: "foo",
      });
      await writeJson(join(root, "dist/copy/package.json"), { name: "dist" });
      await writeJson(join(root, "build/copy/package.json"), { name: "build" });
      await writeJson(join(root, ".git/hooks/package.json"), { name: "git" });
      const result = await findPackageJsonFiles(root);
      expect(result.map((entry) => entry.name)).toEqual(["root"]);
    });
  });

  it("skips dotfile directories", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "package.json"), { name: "root" });
      await writeJson(join(root, ".vscode/extensions/package.json"), {
        name: "hidden",
      });
      const result = await findPackageJsonFiles(root);
      expect(result.map((entry) => entry.name)).toEqual(["root"]);
    });
  });

  it("counts entries across every dependency section", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "package.json"), {
        name: "counts",
        dependencies: { a: "1", b: "2" },
        devDependencies: { c: "3" },
        peerDependencies: { d: "4", e: "5", f: "6" },
        optionalDependencies: { g: "7" },
      });
      const [entry] = await findPackageJsonFiles(root);
      expect(entry.dependencyCounts).toEqual({
        dependencies: 2,
        devDependencies: 1,
        peerDependencies: 3,
        optionalDependencies: 1,
      });
    });
  });

  it("tolerates malformed JSON without aborting the scan", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "good/package.json"), { name: "good" });
      await mkdir(join(root, "broken"));
      await writeFile(join(root, "broken/package.json"), "{ not valid json");
      const result = await findPackageJsonFiles(root);
      expect(result.map((entry) => entry.name)).toEqual(["good"]);
    });
  });

  it("returns null for the name field when the manifest has no name", async () => {
    await withTempDir(async (root) => {
      await writeJson(join(root, "package.json"), {
        dependencies: { a: "1" },
      });
      const [entry] = await findPackageJsonFiles(root);
      expect(entry.name).toBeNull();
    });
  });
});

describe("readPackageJsonDependencies", () => {
  it("returns the four dep arrays plus the name field", async () => {
    await withTempDir(async (root) => {
      const path = join(root, "package.json");
      await writeJson(path, {
        name: "demo",
        dependencies: { lodash: "1", react: "2" },
        devDependencies: { vitest: "3" },
        peerDependencies: { typescript: "5" },
      });
      const result = await readPackageJsonDependencies(path);
      expect(result).toEqual({
        name: "demo",
        dependencies: ["lodash", "react"],
        devDependencies: ["vitest"],
        peerDependencies: ["typescript"],
      });
    });
  });

  it("returns empty arrays when sections are missing", async () => {
    await withTempDir(async (root) => {
      const path = join(root, "package.json");
      await writeJson(path, { name: "empty" });
      const result = await readPackageJsonDependencies(path);
      expect(result).toEqual({
        name: "empty",
        dependencies: [],
        devDependencies: [],
        peerDependencies: [],
      });
    });
  });
});
