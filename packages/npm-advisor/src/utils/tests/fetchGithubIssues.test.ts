/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchGithubIssues } from "../fetchGithubIssues";
import { fetchWithCache } from "../fetchWithCache";

vi.mock("../fetchWithCache", () => ({
  fetchWithCache: vi.fn(),
}));

describe("fetchGithubIssues", () => {
  it("should call fetchWithCache with the correct Github Issues Search URL", async () => {
    const mockData = { items: [] };
    vi.mocked(fetchWithCache).mockResolvedValueOnce(mockData);

    const result = await fetchGithubIssues("facebook", "react");

    const expectedQuery = encodeURIComponent("repo:facebook/react is:issue");
    expect(fetchWithCache).toHaveBeenCalledWith(
      `https://api.github.com/search/issues?q=${expectedQuery}&per_page=100`,
    );
    expect(result).toEqual(mockData);
  });
});
