/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import { classifyLocalPackageSpec } from "../localSpec";

describe("classifyLocalPackageSpec", () => {
  it("classifies each local-package protocol by kind", () => {
    expect(classifyLocalPackageSpec("workspace:*")).toBe("workspace");
    expect(classifyLocalPackageSpec("workspace:^1.2.3")).toBe("workspace");
    expect(classifyLocalPackageSpec("file:../shared/table")).toBe("file");
    expect(classifyLocalPackageSpec("link:../shared/table")).toBe("link");
    expect(classifyLocalPackageSpec("portal:../shared/table")).toBe("portal");
  });

  it("ignores surrounding whitespace", () => {
    expect(classifyLocalPackageSpec("  workspace:*  ")).toBe("workspace");
  });

  it("returns null for registry, git, and url specs", () => {
    expect(classifyLocalPackageSpec("^4.17.0")).toBeNull();
    expect(classifyLocalPackageSpec("~1.2.3")).toBeNull();
    expect(classifyLocalPackageSpec("*")).toBeNull();
    expect(classifyLocalPackageSpec("latest")).toBeNull();
    expect(
      classifyLocalPackageSpec("git+https://example.com/x.git"),
    ).toBeNull();
    expect(classifyLocalPackageSpec("github:user/repo")).toBeNull();
    expect(classifyLocalPackageSpec("https://example.com/x.tgz")).toBeNull();
  });

  it("returns null for empty or non-string input", () => {
    expect(classifyLocalPackageSpec("")).toBeNull();
    expect(classifyLocalPackageSpec(undefined as unknown as string)).toBeNull();
  });
});
