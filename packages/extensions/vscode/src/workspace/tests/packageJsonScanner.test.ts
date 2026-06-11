/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import { EXCLUDE_GLOB } from "../packageJsonScanner";

describe("packageJsonScanner EXCLUDE_GLOB", () => {
  it("excludes dependency and build output directories", () => {
    for (const dir of ["node_modules", "dist", "build", ".git", ".next", "out"]) {
      expect(EXCLUDE_GLOB).toContain(dir);
    }
  });

  it("excludes the .claude hidden config directory", () => {
    expect(EXCLUDE_GLOB).toContain(".claude");
  });

  it("is a recursive glob anchored at any depth", () => {
    expect(EXCLUDE_GLOB.startsWith("**/")).toBe(true);
    expect(EXCLUDE_GLOB.endsWith("/**")).toBe(true);
  });
});
