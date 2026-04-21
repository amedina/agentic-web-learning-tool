/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { parseGithubUrl } from "../parseGithubUrl";

describe("parseGithubUrl", () => {
  it("should return null for empty url", () => {
    expect(parseGithubUrl("")).toBeNull();
  });

  it("should parse standard github urls", () => {
    expect(parseGithubUrl("https://github.com/facebook/react")).toEqual({
      owner: "facebook",
      repo: "react",
    });
  });

  it("should parse git+https urls", () => {
    expect(parseGithubUrl("git+https://github.com/axios/axios.git")).toEqual({
      owner: "axios",
      repo: "axios",
    });
  });

  it("should handle git:// urls", () => {
    expect(parseGithubUrl("git://github.com/isaacs/rimraf.git")).toEqual({
      owner: "isaacs",
      repo: "rimraf",
    });
  });

  it("should return null for non-github urls", () => {
    expect(parseGithubUrl("https://gitlab.com/facebook/react")).toBeNull();
  });

  it("should catch errors on unparseable URLs and return null", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseGithubUrl("not-a-valid-url")).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
