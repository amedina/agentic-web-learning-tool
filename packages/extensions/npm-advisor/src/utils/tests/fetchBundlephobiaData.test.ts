/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchBundlephobiaData } from "../fetchBundlephobiaData";
import { fetchWithCache } from "../fetchWithCache";

vi.mock("../fetchWithCache", () => ({
  fetchWithCache: vi.fn(),
}));

describe("fetchBundlephobiaData", () => {
  it("should call fetchWithCache with the correct Bundlephobia URL", async () => {
    const mockData = { size: 1024, gzip: 512 };
    vi.mocked(fetchWithCache).mockResolvedValueOnce(mockData);

    const result = await fetchBundlephobiaData("react");

    const expectedQuery = encodeURIComponent("react");
    expect(fetchWithCache).toHaveBeenCalledWith(
      `https://bundlephobia.com/api/size?package=${expectedQuery}&record=true`,
    );
    expect(result).toEqual(mockData);
  });
});
