/**
 * External dependencies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Internal dependencies.
 */
import { runAnalyzePackageJson } from "../analyzePackageJson";
import * as analyzerCore from "@agentic-web-labs/package-analyzer-core";

const NPM_V3 = `{
  "name": "demo",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "demo",
      "version": "1.0.0",
      "dependencies": { "lodash": "^4.0.0" }
    },
    "node_modules/lodash": { "version": "4.17.20" }
  }
}
`;

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), "analyze-pj-"));
});

afterEach(() => {
  rmSync(tempRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

/**
 * Build a package.json at the given dir with the supplied
 * dependencies map and return the absolute path.
 */
function writePackageJson(dir: string, deps: Record<string, string>): string {
  mkdirSync(dir, { recursive: true });
  const pkgPath = join(dir, "package.json");
  writeFileSync(
    pkgPath,
    JSON.stringify({ name: "demo", version: "1.0.0", dependencies: deps }),
  );
  return pkgPath;
}

describe("runAnalyzePackageJson lockfile awareness", () => {
  it("passes resolvedVersion from the discovered lockfile into getPackageStats", async () => {
    const pkgPath = writePackageJson(tempRoot, { lodash: "^4.0.0" });
    writeFileSync(join(tempRoot, "package-lock.json"), NPM_V3);
    const spy = vi
      .spyOn(analyzerCore, "getPackageStats")
      .mockResolvedValue(null);

    const result = await runAnalyzePackageJson({ packageJsonPath: pkgPath });

    expect(spy).toHaveBeenCalledWith(
      "lodash",
      "MIT",
      expect.objectContaining({ resolvedVersion: "4.17.20" }),
    );
    expect(result.lockfilePath).toBe(join(tempRoot, "package-lock.json"));
    expect(result.versionResolution).toBe("lockfile");
  });

  it("flags latest-fallback when no lockfile is discovered", async () => {
    const pkgPath = writePackageJson(tempRoot, { lodash: "^4.0.0" });
    const spy = vi
      .spyOn(analyzerCore, "getPackageStats")
      .mockResolvedValue(null);

    const result = await runAnalyzePackageJson({ packageJsonPath: pkgPath });

    expect(spy).toHaveBeenCalledWith(
      "lodash",
      "MIT",
      expect.objectContaining({ resolvedVersion: undefined }),
    );
    expect(result.lockfilePath).toBeNull();
    expect(result.versionResolution).toBe("latest-fallback");
  });

  it("honours an explicit lockfilePath override", async () => {
    const pkgPath = writePackageJson(tempRoot, { lodash: "^4.0.0" });
    const overridePath = join(tempRoot, "fixtures", "package-lock.json");
    mkdirSync(join(tempRoot, "fixtures"), { recursive: true });
    writeFileSync(overridePath, NPM_V3);
    const spy = vi
      .spyOn(analyzerCore, "getPackageStats")
      .mockResolvedValue(null);

    const result = await runAnalyzePackageJson({
      packageJsonPath: pkgPath,
      lockfilePath: overridePath,
    });

    expect(spy).toHaveBeenCalledWith(
      "lodash",
      "MIT",
      expect.objectContaining({ resolvedVersion: "4.17.20" }),
    );
    expect(result.lockfilePath).toBe(overridePath);
    expect(result.versionResolution).toBe("lockfile");
  });

  it("passes undefined when the dep is missing from the lockfile", async () => {
    const pkgPath = writePackageJson(tempRoot, { "not-installed": "^1.0.0" });
    writeFileSync(join(tempRoot, "package-lock.json"), NPM_V3);
    const spy = vi
      .spyOn(analyzerCore, "getPackageStats")
      .mockResolvedValue(null);

    await runAnalyzePackageJson({ packageJsonPath: pkgPath });

    expect(spy).toHaveBeenCalledWith(
      "not-installed",
      "MIT",
      expect.objectContaining({ resolvedVersion: undefined }),
    );
  });
});
