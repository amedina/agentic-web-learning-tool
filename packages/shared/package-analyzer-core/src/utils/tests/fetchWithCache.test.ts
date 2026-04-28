/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchWithCache, clearCache } from "../fetchWithCache";

describe("fetchWithCache", () => {
  beforeEach(() => {
    clearCache();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch data from the network when cache is empty", async () => {
    const mockData = { message: "success" };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchWithCache("https://api.example.com/data");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/data",
      undefined,
    );
    expect(result).toEqual(mockData);
  });

  it("should return cached data on subsequent requests", async () => {
    const mockData = { message: "success" };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    // First call
    await fetchWithCache("https://api.example.com/data");
    // Second call
    const result = await fetchWithCache("https://api.example.com/data");

    expect(global.fetch).toHaveBeenCalledTimes(1); // API called only once
    expect(result).toEqual(mockData);
  });

  it("should return null on a 404 response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await fetchWithCache("https://api.example.com/not-found");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it("should throw an error on non-404 failure responses", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(
      fetchWithCache("https://api.example.com/error"),
    ).rejects.toThrowError(
      "Failed to fetch https://api.example.com/error: Internal Server Error",
    );
  });
});
