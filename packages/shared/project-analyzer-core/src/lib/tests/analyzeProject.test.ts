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
import { analyzeProject } from "../analyzeProject";
import type { PreferredManifest } from "../findReplacementOpportunities";

const MANIFEST_FIXTURE: PreferredManifest = {
  mappings: {
    axios: {
      type: "module",
      moduleName: "axios",
      replacements: ["fetch", "ofetch", "ky"],
      url: { type: "e18e", id: "fetch" },
    },
  },
};

async function makeProject(
  pkgJson: Record<string, unknown>,
  extraFiles: Record<string, string> = {},
): Promise<string> {
  const dir = await fs.mkdtemp(
    path.join(os.tmpdir(), "project-analyzer-orchestrator-"),
  );
  await fs.writeFile(
    path.join(dir, "package.json"),
    JSON.stringify(pkgJson, null, 2),
    "utf8",
  );
  for (const [relativePath, contents] of Object.entries(extraFiles)) {
    await fs.writeFile(path.join(dir, relativePath), contents, "utf8");
  }
  return dir;
}

describe("analyzeProject", () => {
  let projectDir: string | undefined;

  afterEach(async () => {
    if (projectDir) {
      await fs.rm(projectDir, { recursive: true, force: true });
      projectDir = undefined;
    }
  });

  it("merges publint + replacements findings and computes the summary", async () => {
    projectDir = await makeProject(
      {
        name: "fixture-merged",
        version: "1.0.0",
        type: "module",
        main: "index.js",
        exports: {
          "./sub": "./sub.js",
        },
        files: ["index.js", "sub.js"],
        dependencies: { axios: "^1.0.0" },
      },
      { "index.js": "", "sub.js": "" },
    );

    const result = await analyzeProject({
      rootPath: projectDir,
      replacementsManifestProvider: async () => MANIFEST_FIXTURE,
    });

    expect(result.rootPath).toBe(projectDir);
    expect(result.summary.total).toBe(result.findings.length);
    expect(result.summary.bySource.replacements).toBeGreaterThanOrEqual(1);
    expect(result.summary.bySource.publint).toBeGreaterThanOrEqual(1);
    const sources = new Set(result.findings.map((finding) => finding.source));
    expect(sources.has("publint")).toBe(true);
    expect(sources.has("replacements")).toBe(true);
  });

  it("skips publint when skipPublint is set", async () => {
    projectDir = await makeProject({
      name: "fixture-skip-publint",
      version: "1.0.0",
      dependencies: { axios: "^1.0.0" },
    });

    const result = await analyzeProject({
      rootPath: projectDir,
      skipPublint: true,
      replacementsManifestProvider: async () => MANIFEST_FIXTURE,
    });

    for (const finding of result.findings) {
      expect(finding.source).toBe("replacements");
    }
    expect(result.summary.bySource.publint).toBe(0);
  });

  it("propagates manifest-fetch warnings", async () => {
    projectDir = await makeProject({
      name: "fixture-no-manifest",
      version: "1.0.0",
      type: "module",
      main: "index.js",
      files: ["index.js"],
      dependencies: { axios: "^1.0.0" },
    });
    await fs.writeFile(
      path.join(projectDir, "index.js"),
      "export {};\n",
      "utf8",
    );

    const result = await analyzeProject({
      rootPath: projectDir,
      skipPublint: true,
      replacementsManifestProvider: async () => null,
    });

    expect(result.findings).toEqual([]);
    expect(result.warnings.some((w) => w.includes("manifest"))).toBe(true);
  });
});
