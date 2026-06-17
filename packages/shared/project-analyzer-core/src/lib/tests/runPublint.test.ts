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

  it("drops findings for files under node_modules and build-output directories", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-noisy-tree",
      version: "1.0.0",
      type: "module",
    });
    const cjsContents = "module.exports = {};\n";
    await fs.writeFile(path.join(tempDir, "index.js"), cjsContents, "utf8");
    await fs.mkdir(path.join(tempDir, "node_modules", "dep"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(tempDir, "node_modules", "dep", "index.js"),
      cjsContents,
      "utf8",
    );
    await fs.mkdir(path.join(tempDir, "dist"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "dist", "bundle.js"),
      cjsContents,
      "utf8",
    );

    const { findings } = await runPublint({
      pkgDir: tempDir,
      mode: "source",
    });

    const referencedPaths = findings.flatMap((finding) => {
      const args = finding.data?.publintArgs as
        | Record<string, unknown>
        | undefined;
      const candidate = args?.actualFilePath ?? args?.globbedFilePath;
      return typeof candidate === "string" ? [candidate] : [];
    });
    // node_modules is never walked and build-output files are recorded
    // name-only, so the scan never produces format findings rooted there...
    for (const referencedPath of referencedPaths) {
      expect(referencedPath).not.toContain("node_modules");
      expect(referencedPath).not.toContain("dist");
    }
    // ...while the package's own top-level file is still surfaced.
    expect(referencedPaths).toContain("/index.js");
  });

  it("does not flag entry points that resolve into an existing build-output directory", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-dist-entrypoints",
      version: "1.0.0",
      type: "module",
      license: "MIT",
      types: "dist/index.d.ts",
      main: "dist/index.js",
      module: "dist/index.js",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.js",
        },
      },
      files: ["dist/"],
    });
    await fs.mkdir(path.join(tempDir, "dist"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "dist", "index.js"),
      "export const noop = () => {};\n",
      "utf8",
    );
    await fs.writeFile(
      path.join(tempDir, "dist", "index.d.ts"),
      "export declare const noop: () => void;\n",
      "utf8",
    );

    const { findings } = await runPublint({ pkgDir: tempDir, mode: "source" });

    const codes = findings.map((finding) => finding.code);
    expect(codes).not.toContain("FILE_DOES_NOT_EXIST");
  });

  it("still flags an entry point whose build-output target is missing", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-dist-missing",
      version: "1.0.0",
      type: "module",
      license: "MIT",
      main: "dist/index.js",
      exports: {
        ".": "./dist/index.js",
      },
      files: ["dist/"],
    });

    const { findings } = await runPublint({ pkgDir: tempDir, mode: "source" });

    const codes = findings.map((finding) => finding.code);
    expect(codes).toContain("FILE_DOES_NOT_EXIST");
  });

  it("does not flag BIN_FILE_NOT_EXECUTABLE for a bin that resolves into a build-output directory", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-dist-bin",
      version: "1.0.0",
      type: "module",
      license: "MIT",
      bin: {
        "fixture-cli": "./dist/cli.js",
      },
      files: ["dist/"],
    });
    await fs.mkdir(path.join(tempDir, "dist"), { recursive: true });
    // The real build emits a shebang, but the source-mode scan records
    // build-output files name-only, so publint lints empty content and would
    // otherwise raise a spurious BIN_FILE_NOT_EXECUTABLE.
    await fs.writeFile(
      path.join(tempDir, "dist", "cli.js"),
      "#!/usr/bin/env node\nexport const run = () => {};\n",
      "utf8",
    );

    const { findings } = await runPublint({ pkgDir: tempDir, mode: "source" });

    const codes = findings.map((finding) => finding.code);
    expect(codes).not.toContain("BIN_FILE_NOT_EXECUTABLE");
  });

  it("still flags a bin whose source-file target lacks a shebang", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-source-bin",
      version: "1.0.0",
      type: "module",
      license: "MIT",
      bin: {
        "fixture-cli": "./cli.js",
      },
      files: ["cli.js"],
    });
    // A real source file (outside build output) is linted against its actual
    // content, so a genuinely missing shebang must still be reported.
    await fs.writeFile(
      path.join(tempDir, "cli.js"),
      "export const run = () => {};\n",
      "utf8",
    );

    const { findings } = await runPublint({ pkgDir: tempDir, mode: "source" });

    const codes = findings.map((finding) => finding.code);
    expect(codes).toContain("BIN_FILE_NOT_EXECUTABLE");
  });

  // The source-mode scan records files under any build-output directory
  // (dist/build/out) name-only, so the BIN_FILE_NOT_EXECUTABLE false positive
  // can surface for a bin that resolves into any of them, at any depth. All of
  // these shapes must be dropped regardless of the project's folder layout.
  it.each([
    { label: "build/", binPath: "./build/cli.js" },
    { label: "out/", binPath: "./out/cli.js" },
    { label: "a nested build-output path", binPath: "./dist/bin/cli.js" },
  ])(
    "does not flag BIN_FILE_NOT_EXECUTABLE for a bin in $label",
    async ({ binPath }) => {
      const relativePath = binPath.replace(/^\.\//, "");
      const topDirectory = relativePath.split("/")[0];
      await writePackageJson(tempDir, {
        name: "fixture-build-bin",
        version: "1.0.0",
        type: "module",
        license: "MIT",
        bin: {
          "fixture-cli": binPath,
        },
        files: [`${topDirectory}/`],
      });
      const absolutePath = path.join(tempDir, relativePath);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(
        absolutePath,
        "#!/usr/bin/env node\nexport const run = () => {};\n",
        "utf8",
      );

      const { findings } = await runPublint({
        pkgDir: tempDir,
        mode: "source",
      });

      const codes = findings.map((finding) => finding.code);
      expect(codes).not.toContain("BIN_FILE_NOT_EXECUTABLE");
    },
  );

  it("does not flag BIN_FILE_NOT_EXECUTABLE for a string-form bin in build output", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-string-bin",
      version: "1.0.0",
      type: "module",
      license: "MIT",
      bin: "./dist/cli.js",
      files: ["dist/"],
    });
    await fs.mkdir(path.join(tempDir, "dist"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "dist", "cli.js"),
      "#!/usr/bin/env node\nexport const run = () => {};\n",
      "utf8",
    );

    const { findings } = await runPublint({ pkgDir: tempDir, mode: "source" });

    expect(findings.map((finding) => finding.code)).not.toContain(
      "BIN_FILE_NOT_EXECUTABLE",
    );
  });

  it("drops only the build-output bins when a package mixes build-output and source bins", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-mixed-bins",
      version: "1.0.0",
      type: "module",
      license: "MIT",
      bin: {
        "built-cli": "./dist/cli.js",
        "source-cli": "./cli.js",
      },
      files: ["dist/", "cli.js"],
    });
    await fs.mkdir(path.join(tempDir, "dist"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "dist", "cli.js"),
      "#!/usr/bin/env node\nexport const run = () => {};\n",
      "utf8",
    );
    // The source bin genuinely lacks a shebang, so it must still be flagged
    // while the build-output bin's false positive is dropped.
    await fs.writeFile(
      path.join(tempDir, "cli.js"),
      "export const run = () => {};\n",
      "utf8",
    );

    const { findings } = await runPublint({ pkgDir: tempDir, mode: "source" });

    const binFindings = findings.filter(
      (finding) => finding.code === "BIN_FILE_NOT_EXECUTABLE",
    );
    expect(binFindings).toHaveLength(1);
    expect(binFindings[0]?.data?.publintPath).toEqual(["bin", "source-cli"]);
  });

  it("still flags a bin in a non-build-output subdirectory that lacks a shebang", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-lib-bin",
      version: "1.0.0",
      type: "module",
      license: "MIT",
      bin: {
        "fixture-cli": "./lib/cli.js",
      },
      files: ["lib/"],
    });
    await fs.mkdir(path.join(tempDir, "lib"), { recursive: true });
    // `lib/` is not a name-only build-output dir, so publint reads its real
    // content; a genuinely missing shebang must still surface there.
    await fs.writeFile(
      path.join(tempDir, "lib", "cli.js"),
      "export const run = () => {};\n",
      "utf8",
    );

    const { findings } = await runPublint({ pkgDir: tempDir, mode: "source" });

    expect(findings.map((finding) => finding.code)).toContain(
      "BIN_FILE_NOT_EXECUTABLE",
    );
  });

  it("resolves build-output entry points for a package nested under packages/", async () => {
    const packageDir = path.join(tempDir, "packages", "nested");
    await fs.mkdir(path.join(packageDir, "dist"), { recursive: true });
    await writePackageJson(packageDir, {
      name: "fixture-nested",
      version: "1.0.0",
      type: "module",
      license: "MIT",
      types: "dist/index.d.ts",
      main: "dist/index.js",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          import: "./dist/index.js",
        },
      },
      files: ["dist/"],
    });
    await fs.writeFile(
      path.join(packageDir, "dist", "index.js"),
      "export const noop = () => {};\n",
      "utf8",
    );
    await fs.writeFile(
      path.join(packageDir, "dist", "index.d.ts"),
      "export declare const noop: () => void;\n",
      "utf8",
    );

    const { findings } = await runPublint({
      pkgDir: packageDir,
      mode: "source",
    });

    const codes = findings.map((finding) => finding.code);
    expect(codes).not.toContain("FILE_DOES_NOT_EXIST");
  });

  it("skips the scan entirely for a private package", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-private",
      version: "1.0.0",
      private: true,
      type: "module",
    });
    // A file that would normally trip a format finding, proving the skip
    // is about `private` rather than an empty tree.
    await fs.writeFile(
      path.join(tempDir, "index.js"),
      "module.exports = {};\n",
      "utf8",
    );

    const { findings, warnings } = await runPublint({
      pkgDir: tempDir,
      mode: "source",
    });

    expect(findings).toEqual([]);
    expect(warnings.some((warning) => warning.includes("private"))).toBe(true);
  });

  it("truncates and warns when the tree exceeds maxScanFiles", async () => {
    await writePackageJson(tempDir, {
      name: "fixture-large-tree",
      version: "1.0.0",
      type: "module",
    });
    for (let index = 0; index < 5; index += 1) {
      await fs.writeFile(
        path.join(tempDir, `module-${index}.js`),
        "export const value = 1;\n",
        "utf8",
      );
    }

    const { warnings } = await runPublint({
      pkgDir: tempDir,
      mode: "source",
      maxScanFiles: 2,
    });

    expect(
      warnings.some((warning) => warning.includes("only the first 2 files")),
    ).toBe(true);
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
