/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Internal dependencies.
 */
import {
  fetchFromRegistry,
  __resetRegistryPreferenceForTests,
} from "../registryFetch";
import { fetchWithCache, UpstreamFetchError } from "../fetchWithCache";

// Mock only `fetchWithCache`; keep the real `UpstreamFetchError` so the
// `instanceof` rate-limit detection inside `registryFetch` works.
vi.mock("../fetchWithCache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../fetchWithCache")>();
  return {
    ...actual,
    fetchWithCache: vi.fn(),
  };
});

const NPMJS = "https://registry.npmjs.org";
const YARN = "https://registry.yarnpkg.com";
const NPMMIRROR = "https://registry.npmmirror.com";

/** Builds an `UpstreamFetchError` with the given HTTP status for a base. */
function upstreamError(base: string, status: number): UpstreamFetchError {
  return new UpstreamFetchError(`${base}/react`, status, "error");
}

describe("fetchFromRegistry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetRegistryPreferenceForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns data from the primary registry without touching mirrors", async () => {
    const mock = vi.mocked(fetchWithCache);
    mock.mockResolvedValueOnce({ name: "react" });

    const result = await fetchFromRegistry("/react");

    expect(result).toEqual({ name: "react" });
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(`${NPMJS}/react`, undefined, undefined);
  });

  it("falls back to the yarn mirror when the primary is rate-limited", async () => {
    const mock = vi.mocked(fetchWithCache);
    mock.mockRejectedValueOnce(upstreamError(NPMJS, 429));
    mock.mockResolvedValueOnce({ name: "react", from: "yarn" });

    const result = await fetchFromRegistry("/react");

    expect(result).toEqual({ name: "react", from: "yarn" });
    const urls = mock.mock.calls.map((call) => call[0]);
    expect(urls).toEqual([`${NPMJS}/react`, `${YARN}/react`]);
  });

  it("falls back to npmmirror when both the primary and yarn fail", async () => {
    const mock = vi.mocked(fetchWithCache);
    mock.mockRejectedValueOnce(upstreamError(NPMJS, 429));
    mock.mockRejectedValueOnce(new TypeError("network down"));
    mock.mockResolvedValueOnce({ name: "react", from: "npmmirror" });

    const result = await fetchFromRegistry("/react");

    expect(result).toEqual({ name: "react", from: "npmmirror" });
    const urls = mock.mock.calls.map((call) => call[0]);
    expect(urls).toEqual([
      `${NPMJS}/react`,
      `${YARN}/react`,
      `${NPMMIRROR}/react`,
    ]);
  });

  it("throws the rate-limit error when every base fails", async () => {
    const mock = vi.mocked(fetchWithCache);
    mock.mockRejectedValueOnce(upstreamError(NPMJS, 429));
    mock.mockRejectedValueOnce(upstreamError(YARN, 500));
    mock.mockRejectedValueOnce(upstreamError(NPMMIRROR, 503));

    await expect(fetchFromRegistry("/react")).rejects.toMatchObject({
      status: 429,
    });
  });

  it("treats a 404 (null) from the primary as definitive and skips mirrors", async () => {
    const mock = vi.mocked(fetchWithCache);
    mock.mockResolvedValueOnce(null);

    const result = await fetchFromRegistry("/does-not-exist");

    expect(result).toBeNull();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("propagates immediately when the caller's signal is aborted", async () => {
    const mock = vi.mocked(fetchWithCache);
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException("aborted", "AbortError");
    mock.mockRejectedValueOnce(abortError);

    await expect(fetchFromRegistry("/react", controller.signal)).rejects.toBe(
      abortError,
    );
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("prefers the last successful mirror on the next call", async () => {
    const mock = vi.mocked(fetchWithCache);
    mock.mockRejectedValueOnce(upstreamError(NPMJS, 429));
    mock.mockResolvedValueOnce({ name: "react" });
    await fetchFromRegistry("/react");

    mock.mockResolvedValueOnce({ name: "vue" });
    await fetchFromRegistry("/vue");

    const urls = mock.mock.calls.map((call) => call[0]);
    // First call probes npmjs then yarn; the second should start at yarn.
    expect(urls).toEqual([`${NPMJS}/react`, `${YARN}/react`, `${YARN}/vue`]);
  });

  it("re-probes the primary after the preference window lapses", async () => {
    vi.useFakeTimers();
    const mock = vi.mocked(fetchWithCache);
    mock.mockRejectedValueOnce(upstreamError(NPMJS, 429));
    mock.mockResolvedValueOnce({ name: "react" });
    await fetchFromRegistry("/react");

    vi.advanceTimersByTime(61_000);

    mock.mockResolvedValueOnce({ name: "vue" });
    await fetchFromRegistry("/vue");

    const urls = mock.mock.calls.map((call) => call[0]);
    expect(urls[urls.length - 1]).toBe(`${NPMJS}/vue`);
  });
});
