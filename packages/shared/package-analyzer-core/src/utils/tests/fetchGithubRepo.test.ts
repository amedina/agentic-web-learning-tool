/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchGithubRepo } from "../fetchGithubRepo";
import { fetchWithCache } from "../fetchWithCache";

vi.mock("../fetchWithCache", () => ({
  fetchWithCache: vi.fn(),
}));

describe("fetchGithubRepo", () => {
  it("should call fetchWithCache with the correct ungh.cc URL", async () => {
    const mockData = { repo: { stars: 100 } };
    vi.mocked(fetchWithCache).mockResolvedValueOnce(mockData);

    const result = await fetchGithubRepo("facebook", "react");

    expect(fetchWithCache).toHaveBeenCalledWith(
      "https://ungh.cc/repos/facebook/react",
    );
    expect(result).toEqual(mockData);
  });
});
