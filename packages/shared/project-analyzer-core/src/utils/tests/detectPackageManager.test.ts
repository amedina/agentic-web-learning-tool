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
import { detectPackageManager } from "../detectPackageManager";

describe("detectPackageManager", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "project-analyzer-pm-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns 'pnpm' when a pnpm-lock.yaml is present", async () => {
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0" }),
      "utf8",
    );
    await fs.writeFile(
      path.join(tempDir, "pnpm-lock.yaml"),
      "lockfileVersion: '6.0'\n",
      "utf8",
    );
    expect(await detectPackageManager(tempDir)).toBe("pnpm");
  });

  it("returns 'npm' when only a package-lock.json is present", async () => {
    await fs.writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0" }),
      "utf8",
    );
    await fs.writeFile(
      path.join(tempDir, "package-lock.json"),
      JSON.stringify({ name: "fixture", lockfileVersion: 3 }),
      "utf8",
    );
    expect(await detectPackageManager(tempDir)).toBe("npm");
  });
});
