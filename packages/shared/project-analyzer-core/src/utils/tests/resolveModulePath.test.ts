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
import { resolveModulePath } from "../resolveModulePath";

async function makeProject(files: Record<string, string>): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "resolve-module-path-"));
  for (const [relativePath, contents] of Object.entries(files)) {
    const target = path.join(dir, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, contents, "utf8");
  }
  return dir;
}

describe("resolveModulePath", () => {
  let projectDir: string | undefined;

  afterEach(async () => {
    if (projectDir) {
      await fs.rm(projectDir, { recursive: true, force: true });
      projectDir = undefined;
    }
  });

  it("returns null for non-relative specifiers (npm packages, aliases)", async () => {
    projectDir = await makeProject({ "src/a.ts": "export {};" });

    const result = await resolveModulePath(
      path.join(projectDir, "src/a.ts"),
      "react",
    );

    expect(result).toBeNull();
  });

  it("resolves a sibling file by appending the candidate extension", async () => {
    projectDir = await makeProject({
      "src/a.ts": "",
      "src/b.tsx": "",
    });

    const result = await resolveModulePath(
      path.join(projectDir, "src/a.ts"),
      "./b",
    );

    expect(result).toBe(path.join(projectDir, "src/b.tsx"));
  });

  it("resolves `.` to the local index file", async () => {
    projectDir = await makeProject({
      "src/chip/chip.ts": "",
      "src/chip/index.ts": "export {};",
    });

    const result = await resolveModulePath(
      path.join(projectDir, "src/chip/chip.ts"),
      ".",
    );

    expect(result).toBe(path.join(projectDir, "src/chip/index.ts"));
  });

  it("prefers a TS file over a JS sibling", async () => {
    projectDir = await makeProject({
      "src/a.ts": "",
      "src/b.ts": "",
      "src/b.js": "",
    });

    const result = await resolveModulePath(
      path.join(projectDir, "src/a.ts"),
      "./b",
    );

    expect(result).toBe(path.join(projectDir, "src/b.ts"));
  });

  it("resolves an import that already includes the extension", async () => {
    projectDir = await makeProject({
      "src/a.ts": "",
      "src/b.tsx": "",
    });

    const result = await resolveModulePath(
      path.join(projectDir, "src/a.ts"),
      "./b.tsx",
    );

    expect(result).toBe(path.join(projectDir, "src/b.tsx"));
  });

  it("returns null when the specifier does not resolve to any file", async () => {
    projectDir = await makeProject({ "src/a.ts": "" });

    const result = await resolveModulePath(
      path.join(projectDir, "src/a.ts"),
      "./missing",
    );

    expect(result).toBeNull();
  });
});
