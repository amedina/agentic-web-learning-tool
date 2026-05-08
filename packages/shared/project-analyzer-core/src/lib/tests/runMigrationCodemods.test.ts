/**
 * External dependencies.
 */
import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

/**
 * Internal dependencies.
 */
import {
  listSupportedCodemodPackages,
  runMigrationCodemods,
} from "../runMigrationCodemods";

/**
 * Builds a temporary project with the given relative file map and returns
 * its root path. Tests are responsible for cleaning it up via the
 * afterEach hook below.
 */
async function makeProject(files: Record<string, string>): Promise<string> {
  const dir = await fs.mkdtemp(
    path.join(os.tmpdir(), "project-analyzer-codemods-"),
  );
  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = path.join(dir, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, contents, "utf8");
  }
  return dir;
}

describe("runMigrationCodemods", () => {
  let projectDir: string | undefined;

  afterEach(async () => {
    if (projectDir) {
      await fs.rm(projectDir, { recursive: true, force: true });
      projectDir = undefined;
    }
  });

  it("lists every package name that the installed catalog ships a codemod for", () => {
    const supported = listSupportedCodemodPackages();
    expect(supported.length).toBeGreaterThan(0);
    expect(supported).toContain("chalk");
    expect(supported).toEqual([...supported].sort());
  });

  it("returns no edits when no codemod targets any file", async () => {
    projectDir = await makeProject({
      "src/hello.ts": `export const greeting = "hello";\n`,
      "package.json": JSON.stringify({ name: "fixture", version: "1.0.0" }),
    });
    const result = await runMigrationCodemods({
      rootPath: projectDir,
      packageNames: ["chalk"],
    });
    expect(result.edits).toEqual([]);
    expect(result.unsupported).toEqual([]);
    expect(result.filesScanned).toBeGreaterThan(0);
  });

  it("collects requested package names that have no codemod into `unsupported`", async () => {
    projectDir = await makeProject({
      "src/index.ts": `export {};\n`,
    });
    const result = await runMigrationCodemods({
      rootPath: projectDir,
      packageNames: ["chalk", "this-package-has-no-codemod-ever"],
    });
    expect(result.unsupported).toEqual(["this-package-has-no-codemod-ever"]);
  });

  it("skips node_modules / dist / .git when walking the project", async () => {
    projectDir = await makeProject({
      "src/index.ts": `export {};\n`,
      "node_modules/foo/index.js": `module.exports = {};\n`,
      "dist/bundle.js": `(()=>{})();\n`,
      ".git/HEAD": `ref: refs/heads/main\n`,
    });
    const result = await runMigrationCodemods({
      rootPath: projectDir,
      packageNames: ["chalk"],
    });
    expect(result.filesScanned).toBe(1);
  });

  it("rewrites a chalk import via the chalk codemod", async () => {
    projectDir = await makeProject({
      "src/log.js": `import chalk from "chalk";\nconsole.log(chalk.red("oops"));\n`,
    });
    const result = await runMigrationCodemods({
      rootPath: projectDir,
      packageNames: ["chalk"],
    });
    expect(result.unsupported).toEqual([]);
    expect(result.edits).toHaveLength(1);
    const edit = result.edits[0];
    expect(edit.file.endsWith("src/log.js")).toBe(true);
    expect(edit.packageNames).toEqual(["chalk"]);
    expect(edit.originalText).toContain(`from "chalk"`);
    expect(edit.newText).not.toContain(`from "chalk"`);
    expect(edit.newText).toContain("picocolors");
  });
});
