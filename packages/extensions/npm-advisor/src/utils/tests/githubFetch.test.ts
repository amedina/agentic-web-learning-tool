/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Internal dependencies.
 */
import {
  githubFetch,
  clearGithubFetchCache,
  GithubRateLimitError,
} from "../githubFetch";
import { githubAuthService } from "../../serviceWorker/services/githubAuth";

vi.mock("../../serviceWorker/services/githubAuth", () => ({
  githubAuthService: {
    getToken: vi.fn(),
  },
}));

function buildResponse(
  init: Partial<{
    status: number;
    body: unknown;
    headers: Record<string, string>;
    statusText: string;
  }>,
): Response {
  const status = init.status ?? 200;
  const headers = new Headers(init.headers ?? {});
  return new Response(
    init.body !== undefined ? JSON.stringify(init.body) : null,
    {
      status,
      statusText: init.statusText,
      headers,
    },
  );
}

describe("githubFetch", () => {
  beforeEach(() => {
    clearGithubFetchCache();
    global.fetch = vi.fn();
    vi.mocked(githubAuthService.getToken).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("attaches GitHub-recommended headers and no Authorization when no token", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      buildResponse({ status: 200, body: { ok: true } }),
    );

    await githubFetch("https://api.github.com/repos/foo/bar");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/foo/bar",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
  });

  it("attaches an Authorization header when a token is available", async () => {
    vi.mocked(githubAuthService.getToken).mockResolvedValueOnce("ghp_abc");
    (global.fetch as any).mockResolvedValueOnce(
      buildResponse({ status: 200, body: { ok: true } }),
    );

    await githubFetch("https://api.github.com/repos/foo/bar");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/foo/bar",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          Authorization: "Bearer ghp_abc",
        },
      },
    );
  });

  it("returns parsed JSON on success", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      buildResponse({ status: 200, body: { hello: "world" } }),
    );

    const result = await githubFetch("https://api.github.com/x");

    expect(result).toEqual({ hello: "world" });
  });

  it("caches subsequent calls", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      buildResponse({ status: 200, body: { hello: "world" } }),
    );

    await githubFetch("https://api.github.com/x");
    const second = await githubFetch("https://api.github.com/x");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ hello: "world" });
  });

  it("returns null on 404", async () => {
    (global.fetch as any).mockResolvedValueOnce(buildResponse({ status: 404 }));

    const result = await githubFetch("https://api.github.com/missing");

    expect(result).toBeNull();
  });

  it("throws GithubRateLimitError on 403 with x-ratelimit-remaining: 0", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      buildResponse({
        status: 403,
        headers: { "x-ratelimit-remaining": "0" },
      }),
    );

    await expect(
      githubFetch("https://api.github.com/limited"),
    ).rejects.toBeInstanceOf(GithubRateLimitError);
  });

  it("throws GithubRateLimitError on 429", async () => {
    (global.fetch as any).mockResolvedValueOnce(buildResponse({ status: 429 }));

    await expect(
      githubFetch("https://api.github.com/limited"),
    ).rejects.toBeInstanceOf(GithubRateLimitError);
  });

  it("throws a generic error on other non-ok statuses", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      buildResponse({ status: 500, statusText: "Internal Server Error" }),
    );

    await expect(
      githubFetch("https://api.github.com/broken"),
    ).rejects.toThrowError(
      "Failed to fetch https://api.github.com/broken: Internal Server Error",
    );
  });

  it("does not classify 403 without rate-limit header as rate-limit", async () => {
    (global.fetch as any).mockResolvedValueOnce(
      buildResponse({
        status: 403,
        statusText: "Forbidden",
        headers: { "x-ratelimit-remaining": "42" },
      }),
    );

    await expect(
      githubFetch("https://api.github.com/forbidden"),
    ).rejects.toThrowError(
      "Failed to fetch https://api.github.com/forbidden: Forbidden",
    );
  });
});
