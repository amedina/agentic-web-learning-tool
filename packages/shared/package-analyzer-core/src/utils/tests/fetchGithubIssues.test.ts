/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchGithubIssues } from "../fetchGithubIssues";
import {
  githubFetch,
  GithubValidationError,
  GithubRateLimitError,
} from "../githubFetch";
import { fetchGithubRepo } from "../fetchGithubRepo";

// Keep the real error classes so `instanceof` checks inside fetchGithubIssues
// work; only the network-touching `githubFetch` is replaced.
vi.mock("../githubFetch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../githubFetch")>();
  return { ...actual, githubFetch: vi.fn() };
});

vi.mock("../fetchGithubRepo", () => ({ fetchGithubRepo: vi.fn() }));

describe("fetchGithubIssues", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should call githubFetch with the correct Github Issues Search URL", async () => {
    vi.mocked(githubFetch).mockResolvedValueOnce({ items: [] });
    vi.mocked(githubFetch).mockResolvedValueOnce({ total_count: 0 });

    const result = await fetchGithubIssues("facebook", "react");

    expect(githubFetch).toHaveBeenCalledWith(
      "https://api.github.com/search/issues?q=repo:facebook/react%20is:issue&per_page=100",
      undefined,
    );
    expect(result).toEqual({ items: [], openTotalCount: 0 });
    // The happy path resolves on the first try, so no canonical lookup runs.
    expect(fetchGithubRepo).not.toHaveBeenCalled();
  });

  it("resolves the canonical slug and retries when Search 422s on a transferred repo", async () => {
    // First attempt: both Search queries 422 (stale `ladjs/superagent` slug).
    vi.mocked(githubFetch)
      .mockRejectedValueOnce(
        new GithubValidationError(
          "https://api.github.com/search/issues?q=repo:ladjs/superagent%20is:issue&per_page=100",
        ),
      )
      .mockRejectedValueOnce(
        new GithubValidationError(
          "https://api.github.com/search/issues?q=repo:ladjs/superagent%20is:issue%20is:open&per_page=1",
        ),
      )
      // Retry against the canonical slug succeeds.
      .mockResolvedValueOnce({ items: [{ state: "closed" }] })
      .mockResolvedValueOnce({ total_count: 42 });

    vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
      repo: { repo: "forwardemail/superagent" },
    } as any);

    const result = await fetchGithubIssues("ladjs", "superagent");

    expect(fetchGithubRepo).toHaveBeenCalledWith(
      "ladjs",
      "superagent",
      undefined,
    );
    expect(githubFetch).toHaveBeenCalledWith(
      "https://api.github.com/search/issues?q=repo:forwardemail/superagent%20is:issue&per_page=100",
      undefined,
    );
    expect(result).toEqual({
      items: [{ state: "closed" }],
      openTotalCount: 42,
    });
  });

  it("falls back to GitHub REST for the canonical slug when ungh can't resolve it", async () => {
    vi.mocked(githubFetch)
      // First attempt: both Search queries 422.
      .mockRejectedValueOnce(new GithubValidationError("sample"))
      .mockRejectedValueOnce(new GithubValidationError("openCount"))
      // REST fallback resolves the canonical full_name.
      .mockResolvedValueOnce({ full_name: "forwardemail/superagent" })
      // Retry against the canonical slug succeeds.
      .mockResolvedValueOnce({ items: [{ state: "open" }] })
      .mockResolvedValueOnce({ total_count: 7 });
    // ungh is unreachable / yields no slug.
    vi.mocked(fetchGithubRepo).mockResolvedValueOnce(null as any);

    const result = await fetchGithubIssues("ladjs", "superagent");

    expect(githubFetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/ladjs/superagent",
      undefined,
    );
    expect(result).toEqual({ items: [{ state: "open" }], openTotalCount: 7 });
  });

  it("rethrows the 422 when the canonical slug is unchanged", async () => {
    vi.mocked(githubFetch)
      .mockRejectedValueOnce(new GithubValidationError("sample"))
      .mockRejectedValueOnce(new GithubValidationError("openCount"));
    // ungh reports the same slug — nothing to retry against.
    vi.mocked(fetchGithubRepo).mockResolvedValueOnce({
      repo: { repo: "ladjs/superagent" },
    } as any);

    await expect(
      fetchGithubIssues("ladjs", "superagent"),
    ).rejects.toBeInstanceOf(GithubValidationError);
  });

  it("does not attempt a canonical retry for non-validation errors", async () => {
    vi.mocked(githubFetch).mockRejectedValue(
      new GithubRateLimitError("https://api.github.com/search/issues"),
    );

    await expect(fetchGithubIssues("facebook", "react")).rejects.toBeInstanceOf(
      GithubRateLimitError,
    );
    expect(fetchGithubRepo).not.toHaveBeenCalled();
  });
});
