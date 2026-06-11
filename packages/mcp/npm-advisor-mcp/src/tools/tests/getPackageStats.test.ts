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
import { runGetPackageStats } from "../getPackageStats";
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
  tempRoot = mkdtempSync(join(tmpdir(), "get-stats-"));
});

afterEach(() => {
  rmSync(tempRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("runGetPackageStats lockfile awareness", () => {
  it("passes an explicit resolvedVersion into analyzer-core", async () => {
    const spy = vi
      .spyOn(analyzerCore, "getPackageStats")
      .mockResolvedValue(null);

    const result = await runGetPackageStats({
      name: "lodash",
      resolvedVersion: "4.17.20",
    });

    expect(spy).toHaveBeenCalledWith(
      "lodash",
      "MIT",
      expect.objectContaining({ resolvedVersion: "4.17.20" }),
    );
    expect(result.lockfilePath).toBeNull();
  });

  it("walks up from packageJsonPath when no resolvedVersion is provided", async () => {
    const pkgDir = join(tempRoot, "project");
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(join(pkgDir, "package.json"), '{ "name": "demo" }');
    writeFileSync(join(tempRoot, "package-lock.json"), NPM_V3);
    const spy = vi
      .spyOn(analyzerCore, "getPackageStats")
      .mockResolvedValue(null);

    const result = await runGetPackageStats({
      name: "lodash",
      packageJsonPath: join(pkgDir, "package.json"),
    });

    expect(spy).toHaveBeenCalledWith(
      "lodash",
      "MIT",
      expect.objectContaining({ resolvedVersion: "4.17.20" }),
    );
    expect(result.lockfilePath).toBe(join(tempRoot, "package-lock.json"));
  });

  it("returns null lockfilePath and undefined resolvedVersion when no lockfile is found", async () => {
    const pkgDir = join(tempRoot, "lonely");
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(join(pkgDir, "package.json"), "{}");
    const spy = vi
      .spyOn(analyzerCore, "getPackageStats")
      .mockResolvedValue(null);

    const result = await runGetPackageStats({
      name: "lodash",
      packageJsonPath: join(pkgDir, "package.json"),
    });

    expect(spy).toHaveBeenCalledWith(
      "lodash",
      "MIT",
      expect.objectContaining({ resolvedVersion: undefined }),
    );
    expect(result.lockfilePath).toBeNull();
  });

  it("uses an explicit lockfilePath override", async () => {
    const pkgDir = join(tempRoot, "project");
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(join(pkgDir, "package.json"), "{}");
    const overridePath = join(tempRoot, "other", "package-lock.json");
    mkdirSync(join(tempRoot, "other"), { recursive: true });
    writeFileSync(overridePath, NPM_V3);
    const spy = vi
      .spyOn(analyzerCore, "getPackageStats")
      .mockResolvedValue(null);

    const result = await runGetPackageStats({
      name: "lodash",
      packageJsonPath: join(pkgDir, "package.json"),
      lockfilePath: overridePath,
    });

    expect(spy).toHaveBeenCalledWith(
      "lodash",
      "MIT",
      expect.objectContaining({ resolvedVersion: "4.17.20" }),
    );
    expect(result.lockfilePath).toBe(overridePath);
  });
});
