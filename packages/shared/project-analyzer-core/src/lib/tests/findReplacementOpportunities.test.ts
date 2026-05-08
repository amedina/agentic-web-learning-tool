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
import {
  findReplacementOpportunities,
  type PreferredManifest,
} from "../findReplacementOpportunities";

const MANIFEST_FIXTURE: PreferredManifest = {
  mappings: {
    axios: {
      type: "module",
      moduleName: "axios",
      replacements: ["fetch", "ofetch", "ky"],
      url: { type: "e18e", id: "fetch" },
    },
    chalk: {
      type: "module",
      moduleName: "chalk",
      replacements: ["picocolors"],
      url: { type: "e18e", id: "chalk" },
    },
  },
};

async function makeProject(pkgJson: Record<string, unknown>): Promise<string> {
  const dir = await fs.mkdtemp(
    path.join(os.tmpdir(), "project-analyzer-replacements-"),
  );
  await fs.writeFile(
    path.join(dir, "package.json"),
    JSON.stringify(pkgJson, null, 2),
    "utf8",
  );
  return dir;
}

describe("findReplacementOpportunities", () => {
  let projectDir: string | undefined;

  afterEach(async () => {
    if (projectDir) {
      await fs.rm(projectDir, { recursive: true, force: true });
      projectDir = undefined;
    }
  });

  it("returns one finding per matched top-level dependency", async () => {
    projectDir = await makeProject({
      name: "fixture",
      version: "1.0.0",
      dependencies: { axios: "^1.0.0", "left-pad": "^1.0.0" },
      devDependencies: { chalk: "^5.0.0", typescript: "^5.0.0" },
    });

    const { findings, warnings } = await findReplacementOpportunities({
      rootPath: projectDir,
      manifestProvider: async () => MANIFEST_FIXTURE,
    });

    expect(warnings).toEqual([]);
    const codes = findings.map((finding) => finding.code);
    expect(codes).toEqual(["REPLACEMENT_AVAILABLE", "REPLACEMENT_AVAILABLE"]);

    const axiosFinding = findings.find(
      (finding) => finding.data?.packageName === "axios",
    );
    expect(axiosFinding?.severity).toBe("info");
    expect(axiosFinding?.source).toBe("replacements");
    expect(axiosFinding?.data?.depCategory).toBe("runtime");
    expect(axiosFinding?.data?.replacements).toEqual(["fetch", "ofetch", "ky"]);
    expect(axiosFinding?.data?.documentationUrl).toBe(
      "https://e18e.dev/guide/replacements/fetch.html",
    );
    expect(axiosFinding?.file).toBe(path.join(projectDir, "package.json"));

    const chalkFinding = findings.find(
      (finding) => finding.data?.packageName === "chalk",
    );
    expect(chalkFinding?.data?.depCategory).toBe("dev");
  });

  it("does not duplicate findings when a name appears in multiple buckets", async () => {
    projectDir = await makeProject({
      name: "fixture-dup",
      version: "1.0.0",
      dependencies: { axios: "^1.0.0" },
      devDependencies: { axios: "^1.0.0" },
      peerDependencies: { axios: "^1.0.0" },
    });

    const { findings } = await findReplacementOpportunities({
      rootPath: projectDir,
      manifestProvider: async () => MANIFEST_FIXTURE,
    });

    expect(findings).toHaveLength(1);
    expect(findings[0].data?.depCategory).toBe("runtime");
  });

  it("returns empty findings (no warning) when no dependency matches", async () => {
    projectDir = await makeProject({
      name: "fixture-clean",
      version: "1.0.0",
      dependencies: { typescript: "^5.0.0" },
    });

    const result = await findReplacementOpportunities({
      rootPath: projectDir,
      manifestProvider: async () => MANIFEST_FIXTURE,
    });

    expect(result.findings).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("returns a warning when the manifest cannot be loaded", async () => {
    projectDir = await makeProject({
      name: "fixture-no-manifest",
      version: "1.0.0",
      dependencies: { axios: "^1.0.0" },
    });

    const result = await findReplacementOpportunities({
      rootPath: projectDir,
      manifestProvider: async () => null,
    });

    expect(result.findings).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/preferred-replacements manifest/);
  });

  it("returns a warning when package.json is missing", async () => {
    const dir = await fs.mkdtemp(
      path.join(os.tmpdir(), "project-analyzer-missing-"),
    );
    try {
      const result = await findReplacementOpportunities({
        rootPath: dir,
        manifestProvider: async () => MANIFEST_FIXTURE,
      });
      expect(result.findings).toEqual([]);
      expect(result.warnings[0]).toMatch(/Could not read/);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
