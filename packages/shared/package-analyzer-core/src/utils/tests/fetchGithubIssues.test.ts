/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchGithubIssues } from "../fetchGithubIssues";
import { githubFetch } from "../githubFetch";

vi.mock("../githubFetch", () => ({
  githubFetch: vi.fn(),
}));

describe("fetchGithubIssues", () => {
  it("should call githubFetch with the correct Github Issues Search URL", async () => {
    const mockData = { items: [] };
    vi.mocked(githubFetch).mockResolvedValueOnce(mockData);
    vi.mocked(githubFetch).mockResolvedValueOnce({ total_count: 0 });

    const result = await fetchGithubIssues("facebook", "react");

    expect(githubFetch).toHaveBeenCalledWith(
      "https://api.github.com/search/issues?q=repo:facebook/react%20is:issue&per_page=100",
    );
    expect(result).toEqual({ items: [], openTotalCount: 0 });
  });
});
