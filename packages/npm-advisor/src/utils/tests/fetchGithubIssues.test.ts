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
  it("should call fetchWithCache with the correct Github Issues Search URLs", async () => {
    vi.mocked(fetchWithCache).mockResolvedValue({ items: [] });

    const result = await fetchGithubIssues("facebook", "react");

    expect(fetchWithCache).toHaveBeenCalledWith(
      "https://api.github.com/search/issues?q=repo:facebook/react is:issue&per_page=100",
    );
    expect(fetchWithCache).toHaveBeenCalledWith(
      "https://api.github.com/search/issues?q=repo:facebook/react is:issue is:open&per_page=1",
    );
    expect(result).toEqual({ items: [], openTotalCount: null });
  });
});
