/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Internal dependencies.
 */
import { npmSearchService } from "../npmSearch";

describe("npmSearchService — search with registry fallback", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns Algolia results without falling back when Algolia succeeds", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hits: [{ name: "react" }],
        nbPages: 2,
        page: 0,
        nbHits: 30,
      }),
    });

    const result = await npmSearchService.search({ query: "react" });

    expect(result.hits).toEqual([{ name: "react" }]);
    expect(result.degraded).toBeFalsy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the registry search and adapts the response when Algolia fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: "Too Many Requests",
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        objects: [
          {
            package: {
              name: "react",
              version: "18.0.0",
              description: "A library",
              date: "2022-01-01T00:00:00.000Z",
              links: {
                homepage: "https://react.dev",
                repository: "https://github.com/facebook/react",
              },
              keywords: ["ui"],
              publisher: { username: "fb" },
            },
          },
        ],
        total: 1,
      }),
    });

    const result = await npmSearchService.search({
      query: "react",
      page: 0,
      hitsPerPage: 20,
    });

    expect(result.degraded).toBe(true);
    expect(result.nbHits).toBe(1);
    expect(result.hits[0]).toMatchObject({
      name: "react",
      version: "18.0.0",
      homepage: "https://react.dev",
      repository: { url: "https://github.com/facebook/react" },
      owner: { name: "fb" },
    });
    expect(fetchMock.mock.calls[1][0]).toContain(
      "registry.npmmirror.com/-/v1/search",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces the original Algolia error when the fallback also fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, statusText: "Server Error" });
    fetchMock.mockRejectedValueOnce(new Error("registry network error"));

    await expect(npmSearchService.search({ query: "react" })).rejects.toThrow(
      /Algolia search failed/,
    );
  });

  it("returns an empty degraded result for an empty query without hitting the registry", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: "Too Many Requests",
    });

    const result = await npmSearchService.search({ query: "" });

    expect(result.hits).toEqual([]);
    expect(result.degraded).toBe(true);
    // Only the Algolia attempt fired; the empty-query fallback short-circuits.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
