/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchGithubSecurityAdvisories } from "../fetchGithubSecurityAdvisories";
import { githubFetch } from "../githubFetch";

vi.mock("../githubFetch", () => ({
  githubFetch: vi.fn(),
}));

describe("fetchGithubSecurityAdvisories", () => {
  it("should call githubFetch with the correct URL", async () => {
    const mockData = [{ summary: "Advisory 1" }];
    vi.mocked(githubFetch).mockResolvedValueOnce(mockData);

    const result = await fetchGithubSecurityAdvisories("facebook", "react");

    expect(githubFetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/facebook/react/security-advisories",
    );
    expect(result).toEqual(mockData);
  });
});
