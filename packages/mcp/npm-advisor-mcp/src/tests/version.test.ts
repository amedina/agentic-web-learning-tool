/**
 * External dependencies.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import { PACKAGE_NAME, SERVER_NAME, SERVER_VERSION } from "../version";

/**
 * Resolve the canonical package.json that lives one directory above
 * this test (the package root). Reading it directly here keeps the
 * test self-contained — no fixture, no shared state.
 */
function loadPackageJson() {
  const path = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "package.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as {
    name: string;
    version: string;
  };
}

describe("version", () => {
  it("SERVER_VERSION matches the package.json version", () => {
    const packageJson = loadPackageJson();
    expect(SERVER_VERSION).toBe(packageJson.version);
  });

  it("PACKAGE_NAME matches the package.json name", () => {
    const packageJson = loadPackageJson();
    expect(PACKAGE_NAME).toBe(packageJson.name);
  });

  it("SERVER_NAME is the public-facing identifier MCP clients see", () => {
    expect(SERVER_NAME).toBe("npm-advisor");
  });
});
