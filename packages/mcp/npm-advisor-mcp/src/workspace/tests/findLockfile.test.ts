/**
 * External dependencies.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Internal dependencies.
 */
import { findAndParseLockfile, parseLockfileAtPath } from "../findLockfile";

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
  tempRoot = mkdtempSync(join(tmpdir(), "find-lockfile-"));
});

afterEach(() => {
  rmSync(tempRoot, { recursive: true, force: true });
});

describe("findAndParseLockfile", () => {
  it("finds a lockfile in the start directory", async () => {
    writeFileSync(join(tempRoot, "package-lock.json"), NPM_V3);
    const result = await findAndParseLockfile(tempRoot);
    expect(result?.path).toBe(join(tempRoot, "package-lock.json"));
    expect(result?.parsed.format).toBe("npm");
    expect(result?.parsed.topLevel.lodash).toBe("4.17.20");
  });

  it("walks up to find a lockfile at the workspace root", async () => {
    const sub = join(tempRoot, "packages", "a");
    mkdirSync(sub, { recursive: true });
    writeFileSync(join(tempRoot, "package-lock.json"), NPM_V3);
    const result = await findAndParseLockfile(sub);
    expect(result?.path).toBe(join(tempRoot, "package-lock.json"));
  });

  it("returns null when no lockfile is found anywhere above", async () => {
    const sub = join(tempRoot, "no-lock");
    mkdirSync(sub, { recursive: true });
    const result = await findAndParseLockfile(sub);
    expect(result).toBeNull();
  });

  it("prefers package-lock.json over a sibling pnpm-lock.yaml", async () => {
    writeFileSync(join(tempRoot, "package-lock.json"), NPM_V3);
    writeFileSync(
      join(tempRoot, "pnpm-lock.yaml"),
      "lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies: {}\n",
    );
    const result = await findAndParseLockfile(tempRoot);
    expect(result?.path).toBe(join(tempRoot, "package-lock.json"));
    expect(result?.parsed.format).toBe("npm");
  });

  it("returns null when the lockfile is malformed", async () => {
    writeFileSync(join(tempRoot, "package-lock.json"), "{ not valid json");
    const result = await findAndParseLockfile(tempRoot);
    expect(result).toBeNull();
  });
});

describe("parseLockfileAtPath", () => {
  it("reads and parses an explicit lockfile path", async () => {
    const lockfilePath = join(tempRoot, "package-lock.json");
    writeFileSync(lockfilePath, NPM_V3);
    const result = await parseLockfileAtPath(lockfilePath);
    expect(result?.path).toBe(lockfilePath);
    expect(result?.parsed.topLevel.lodash).toBe("4.17.20");
  });

  it("returns null when the file doesn't exist", async () => {
    const result = await parseLockfileAtPath(join(tempRoot, "missing.json"));
    expect(result).toBeNull();
  });
});
