/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchGithubSecurityAdvisories } from "../fetchGithubSecurityAdvisories";
import { fetchWithCache } from "../fetchWithCache";

vi.mock("../fetchWithCache", () => ({
  fetchWithCache: vi.fn(),
}));

describe("fetchGithubSecurityAdvisories", () => {
  it("should call fetchWithCache with the correct URL", async () => {
    const mockData = [{ summary: "Advisory 1" }];
    vi.mocked(fetchWithCache).mockResolvedValueOnce(mockData);

    const result = await fetchGithubSecurityAdvisories("facebook", "react");

    expect(fetchWithCache).toHaveBeenCalledWith(
      "https://api.github.com/repos/facebook/react/security-advisories",
    );
    expect(result).toEqual(mockData);
  });
});
