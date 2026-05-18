/**
 * External dependencies.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

/**
 * Internal dependencies.
 */
import { runPublint } from "../runPublint";

/**
 * Creates a throwaway directory under the OS temp dir and returns its path.
 * The returned directory is unique per call so tests cannot collide.
 */
async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "project-analyzer-publint-"));
}

/**
 * Writes a package.json at `dir` with the given contents.
 */
async function writePackageJson(
  dir: string,
  contents: Record<string, unknown>,
): Promise<void> {
  await fs.writeFile(
    path.join(dir, "package.json"),
    JSON.stringify(contents, null, 2),
    "utf8",
  );
}

describe("runPublint (source mode)", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns no findings for a minimally-valid ESM package", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-clean",
      version: "1.0.0",
      type: "module",
      license: "MIT",
      main: "index.js",
      exports: {
        ".": "./index.js",
      },
      files: ["index.js"],
    });
    await fs.writeFile(
      path.join(tempDir, "index.js"),
      "export const noop = () => {};\n",
      "utf8",
    );

    const { findings } = await runPublint({ pkgDir: tempDir, mode: "source" });
    expect(findings).toEqual([]);
  });

  it("flags a missing exports entrypoint when exports has subpaths but no root", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-missing-root",
      version: "1.0.0",
      type: "module",
      main: "index.js",
      exports: {
        "./sub": "./sub.js",
      },
      files: ["index.js", "sub.js"],
    });
    await fs.writeFile(path.join(tempDir, "index.js"), "", "utf8");
    await fs.writeFile(path.join(tempDir, "sub.js"), "", "utf8");

    const { findings } = await runPublint({ pkgDir: tempDir, mode: "source" });
    const codes = findings.map((finding) => finding.code);
    expect(codes).toContain("EXPORTS_MISSING_ROOT_ENTRYPOINT");

    const rootFinding = findings.find(
      (finding) => finding.code === "EXPORTS_MISSING_ROOT_ENTRYPOINT",
    );
    expect(rootFinding?.source).toBe("publint");
    expect(rootFinding?.file).toBe(path.join(tempDir, "package.json"));
    expect(rootFinding?.severity).toMatch(/^(error|warning|info)$/);
    expect(rootFinding?.data?.publintPath).toBeDefined();
  });

  it("respects the level filter (error-only suppresses warnings/suggestions)", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-suggestion-only",
      version: "1.0.0",
    });

    const allLevels = await runPublint({ pkgDir: tempDir, mode: "source" });
    const errorsOnly = await runPublint({
      pkgDir: tempDir,
      mode: "source",
      level: "error",
    });

    expect(errorsOnly.findings.length).toBeLessThanOrEqual(
      allLevels.findings.length,
    );
    for (const finding of errorsOnly.findings) {
      expect(finding.severity).toBe("error");
    }
  });
});
