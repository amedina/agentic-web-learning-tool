/**
 * External dependencies.
 */
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Internal dependencies.
 */
import { runAnalyzeProject } from "../analyzeProject";

describe("runAnalyzeProject", () => {
  let projectDir: string | undefined;

  afterEach(() => {
    if (projectDir) {
      rmSync(projectDir, { recursive: true, force: true });
      projectDir = undefined;
    }
  });

  it("resolves a relative rootPath against process.cwd() and returns a ProjectAnalysis", async () => {
    projectDir = mkdtempSync(join(tmpdir(), "npm-advisor-analyze-project-"));
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({
        name: "fixture",
        version: "1.0.0",
        type: "module",
        license: "MIT",
        main: "index.js",
        files: ["index.js"],
      }),
      "utf8",
    );
    writeFileSync(join(projectDir, "index.js"), "export {};\n", "utf8");

    const result = await runAnalyzeProject({
      rootPath: projectDir,
      skipReplacements: true,
    });

    expect(result.rootPath).toBe(projectDir);
    expect(result.summary.bySource.replacements).toBe(0);
    expect(Array.isArray(result.findings)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("returns publint findings for a package with a publishing-hygiene issue", async () => {
    projectDir = mkdtempSync(join(tmpdir(), "npm-advisor-analyze-project-"));
    writeFileSync(
      join(projectDir, "package.json"),
      JSON.stringify({
        name: "fixture-bad-exports",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        exports: { "./sub": "./sub.js" },
        files: ["index.js", "sub.js"],
      }),
      "utf8",
    );
    writeFileSync(join(projectDir, "index.js"), "", "utf8");
    writeFileSync(join(projectDir, "sub.js"), "", "utf8");

    const result = await runAnalyzeProject({
      rootPath: projectDir,
      skipReplacements: true,
    });

    const codes = result.findings.map((finding) => finding.code);
    expect(codes).toContain("EXPORTS_MISSING_ROOT_ENTRYPOINT");
    expect(result.summary.bySource.publint).toBeGreaterThanOrEqual(1);
  });
});
