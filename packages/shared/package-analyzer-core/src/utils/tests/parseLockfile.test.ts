/**
 * External dependencies.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Internal dependencies.
 */
import { parseLockfile, UnsupportedLockfileError } from "../parseLockfile";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "lockfiles",
);

/**
 * Read a checked-in lockfile fixture from disk so the parser is exercised
 * against real-shaped input rather than inline string literals.
 */
function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

describe("parseLockfile - format detection", () => {
  it("detects npm from package-lock.json", () => {
    const result = parseLockfile(
      "package-lock.json",
      readFixture("package-lock.v3.json"),
    );
    expect(result.format).toBe("npm");
  });

  it("detects npm-shrinkwrap.json as npm", () => {
    const result = parseLockfile(
      "npm-shrinkwrap.json",
      readFixture("package-lock.v1.json"),
    );
    expect(result.format).toBe("npm");
  });

  it("detects pnpm from pnpm-lock.yaml", () => {
    const result = parseLockfile(
      "pnpm-lock.yaml",
      readFixture("pnpm-lock.v9.yaml"),
    );
    expect(result.format).toBe("pnpm");
  });

  it("detects yarn classic from yarn.lock without __metadata", () => {
    const result = parseLockfile("yarn.lock", readFixture("yarn.lock.classic"));
    expect(result.format).toBe("yarn");
  });

  it("detects yarn berry from yarn.lock with __metadata", () => {
    const result = parseLockfile("yarn.lock", readFixture("yarn.lock.berry"));
    expect(result.format).toBe("yarn-berry");
  });

  it("accepts a nested path and uses the basename", () => {
    const result = parseLockfile(
      "/some/repo/path/package-lock.json",
      readFixture("package-lock.v3.json"),
    );
    expect(result.format).toBe("npm");
  });

  it("throws UnsupportedLockfileError for unknown filenames", () => {
    expect(() => parseLockfile("Pipfile.lock", "{}")).toThrow(
      UnsupportedLockfileError,
    );
  });
});

describe("parseLockfile - npm v1", () => {
  it("returns top-level resolutions for direct deps", () => {
    const result = parseLockfile(
      "package-lock.json",
      readFixture("package-lock.v1.json"),
    );
    expect(result.format).toBe("npm");
    expect(result.topLevel.react).toBe("18.2.0");
    expect(result.topLevel["@scope/util"]).toBe("1.2.3");
  });

  it("omits non-semver (git+ssh) resolutions", () => {
    const result = parseLockfile(
      "package-lock.json",
      readFixture("package-lock.v1.json"),
    );
    expect("from-git" in result.topLevel).toBe(false);
  });
});

describe("parseLockfile - npm v2/v3", () => {
  it("returns versions of direct deps via packages[node_modules/<name>]", () => {
    const result = parseLockfile(
      "package-lock.json",
      readFixture("package-lock.v3.json"),
    );
    expect(result.format).toBe("npm");
    expect(result.topLevel.react).toBe("18.2.0");
    expect(result.topLevel["@scope/util"]).toBe("1.2.3");
    expect(result.topLevel.vitest).toBe("3.2.4");
  });

  it("omits non-semver resolutions even when declared in the root", () => {
    const result = parseLockfile(
      "package-lock.json",
      readFixture("package-lock.v3.json"),
    );
    expect("from-git" in result.topLevel).toBe(false);
  });

  it("throws UnsupportedLockfileError on an unknown lockfileVersion", () => {
    const bad = JSON.stringify({ lockfileVersion: 99, packages: {} });
    expect(() => parseLockfile("package-lock.json", bad)).toThrow(
      UnsupportedLockfileError,
    );
  });

  it("throws UnsupportedLockfileError when lockfileVersion is missing", () => {
    const bad = JSON.stringify({ packages: {} });
    expect(() => parseLockfile("package-lock.json", bad)).toThrow(
      UnsupportedLockfileError,
    );
  });
});

describe("parseLockfile - pnpm", () => {
  it("reads importers['.'] under v9", () => {
    const result = parseLockfile(
      "pnpm-lock.yaml",
      readFixture("pnpm-lock.v9.yaml"),
    );
    expect(result.format).toBe("pnpm");
    expect(result.topLevel.react).toBe("18.2.0");
    expect(result.topLevel["@scope/util"]).toBe("1.2.3");
    expect(result.topLevel.vitest).toBe("3.2.4");
  });

  it("reads root dependencies under v5.4", () => {
    const result = parseLockfile(
      "pnpm-lock.yaml",
      readFixture("pnpm-lock.v5_4.yaml"),
    );
    expect(result.format).toBe("pnpm");
    expect(result.topLevel.react).toBe("18.2.0");
    expect(result.topLevel["@scope/util"]).toBe("1.2.3");
    expect(result.topLevel.vitest).toBe("3.2.4");
  });

  it("omits non-semver (git/url) resolutions", () => {
    const result = parseLockfile(
      "pnpm-lock.yaml",
      readFixture("pnpm-lock.v9.yaml"),
    );
    expect("from-git" in result.topLevel).toBe(false);
  });

  it("strips pnpm peer-dependency suffixes from version strings", () => {
    const withPeerSuffix = `lockfileVersion: '9.0'

importers:
  .:
    dependencies:
      foo:
        specifier: ^1.0.0
        version: 1.0.0(react@18.2.0)
`;
    const result = parseLockfile("pnpm-lock.yaml", withPeerSuffix);
    expect(result.topLevel.foo).toBe("1.0.0");
  });

  it("throws UnsupportedLockfileError on unknown lockfileVersion", () => {
    const bad = `lockfileVersion: '99.0'\nimporters:\n  .:\n    dependencies: {}\n`;
    expect(() => parseLockfile("pnpm-lock.yaml", bad)).toThrow(
      UnsupportedLockfileError,
    );
  });
});

describe("parseLockfile - yarn classic", () => {
  it("returns highest resolved version for each name", () => {
    const result = parseLockfile("yarn.lock", readFixture("yarn.lock.classic"));
    expect(result.format).toBe("yarn");
    expect(result.topLevel.react).toBe("18.2.0");
    expect(result.topLevel["@scope/util"]).toBe("1.2.3");
    expect(result.topLevel.vitest).toBe("3.2.4");
  });

  it("omits non-semver (git+ssh) entries", () => {
    const result = parseLockfile("yarn.lock", readFixture("yarn.lock.classic"));
    expect("from-git" in result.topLevel).toBe(false);
  });

  it("picks the highest version when multiple resolutions exist", () => {
    const contents = `# yarn lockfile v1


foo@^1.0.0:
  version "1.0.0"
  resolved "https://x/foo-1.0.0.tgz"

foo@^1.2.0:
  version "1.5.0"
  resolved "https://x/foo-1.5.0.tgz"

foo@^1.1.0:
  version "1.2.0"
  resolved "https://x/foo-1.2.0.tgz"
`;
    const result = parseLockfile("yarn.lock", contents);
    expect(result.topLevel.foo).toBe("1.5.0");
  });
});

describe("parseLockfile - yarn berry", () => {
  it("returns resolved versions across npm:-locator entries", () => {
    const result = parseLockfile("yarn.lock", readFixture("yarn.lock.berry"));
    expect(result.format).toBe("yarn-berry");
    expect(result.topLevel.react).toBe("18.2.0");
    expect(result.topLevel["@scope/util"]).toBe("1.2.3");
    expect(result.topLevel.vitest).toBe("3.2.4");
  });

  it("omits workspace: resolutions", () => {
    const result = parseLockfile("yarn.lock", readFixture("yarn.lock.berry"));
    expect("demo-workspace" in result.topLevel).toBe(false);
  });
});
