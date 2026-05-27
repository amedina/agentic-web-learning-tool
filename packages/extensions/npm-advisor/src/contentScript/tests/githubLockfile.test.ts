/**
 * External dependencies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchRepoLockfile, parseGithubBlobUrl } from "../githubLockfile";

const NPM_V3 = `{
  "name": "demo",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": { "name": "demo", "version": "1.0.0", "dependencies": { "lodash": "^4.0.0" } },
    "node_modules/lodash": { "version": "4.17.20" }
  }
}
`;

const PNPM = `lockfileVersion: '9.0'

importers:
  .:
    dependencies:
      react:
        specifier: ^18.0.0
        version: 18.2.0
`;

interface MockResponse {
  status?: number;
  body?: string;
  contentLength?: number;
}

/**
 * Build a fetch stub that responds to URLs found in `responses` and 404s
 * for everything else. Returns the spy so tests can assert URL order.
 */
function stubFetch(responses: Record<string, MockResponse>) {
  const spy = vi.fn((url: string) => {
    const config = responses[url];
    if (!config) {
      return Promise.resolve({ ok: false, status: 404 } as unknown as Response);
    }
    const headers = new Map<string, string>();
    if (config.contentLength !== undefined) {
      headers.set("content-length", String(config.contentLength));
    }
    return Promise.resolve({
      ok: (config.status ?? 200) < 400,
      status: config.status ?? 200,
      text: () => Promise.resolve(config.body ?? ""),
      headers: { get: (key: string) => headers.get(key.toLowerCase()) ?? null },
    } as unknown as Response);
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseGithubBlobUrl", () => {
  it("extracts owner / repo / ref / packageJsonPath from a blob URL", () => {
    expect(
      parseGithubBlobUrl(
        "https://github.com/lodash/lodash/blob/main/packages/foo/package.json",
      ),
    ).toEqual({
      owner: "lodash",
      repo: "lodash",
      ref: "main",
      packageJsonPath: "packages/foo/package.json",
    });
  });

  it("handles root-level package.json", () => {
    expect(
      parseGithubBlobUrl(
        "https://github.com/owner/repo/blob/abc123/package.json",
      ),
    ).toEqual({
      owner: "owner",
      repo: "repo",
      ref: "abc123",
      packageJsonPath: "package.json",
    });
  });

  it("returns null for non-blob URLs", () => {
    expect(
      parseGithubBlobUrl("https://github.com/owner/repo/tree/main"),
    ).toBeNull();
    expect(parseGithubBlobUrl("https://npmjs.com/package/react")).toBeNull();
  });
});

describe("fetchRepoLockfile", () => {
  it("walks ancestor directories looking for a lockfile", async () => {
    const spy = stubFetch({
      "https://raw.githubusercontent.com/owner/repo/main/packages/foo/package-lock.json":
        { status: 404 },
      "https://raw.githubusercontent.com/owner/repo/main/packages/foo/pnpm-lock.yaml":
        { status: 404 },
      "https://raw.githubusercontent.com/owner/repo/main/packages/foo/yarn.lock":
        { status: 404 },
      "https://raw.githubusercontent.com/owner/repo/main/packages/package-lock.json":
        { status: 404 },
      "https://raw.githubusercontent.com/owner/repo/main/package-lock.json": {
        body: NPM_V3,
      },
    });

    const result = await fetchRepoLockfile({
      owner: "owner",
      repo: "repo",
      ref: "main",
      packageJsonPath: "packages/foo/package.json",
    });

    expect(result?.url).toBe(
      "https://raw.githubusercontent.com/owner/repo/main/package-lock.json",
    );
    expect(result?.parsed.topLevel.lodash).toBe("4.17.20");
    // Should have probed deeper directories first.
    expect(spy).toHaveBeenCalled();
  });

  it("prefers package-lock.json over a sibling pnpm-lock.yaml", async () => {
    stubFetch({
      "https://raw.githubusercontent.com/owner/repo/main/package-lock.json": {
        body: NPM_V3,
      },
      "https://raw.githubusercontent.com/owner/repo/main/pnpm-lock.yaml": {
        body: PNPM,
      },
    });

    const result = await fetchRepoLockfile({
      owner: "owner",
      repo: "repo",
      ref: "main",
      packageJsonPath: "package.json",
    });

    expect(result?.url).toBe(
      "https://raw.githubusercontent.com/owner/repo/main/package-lock.json",
    );
    expect(result?.parsed.format).toBe("npm");
  });

  it("returns null when no lockfile is found anywhere", async () => {
    stubFetch({});
    const result = await fetchRepoLockfile({
      owner: "owner",
      repo: "repo",
      ref: "main",
      packageJsonPath: "package.json",
    });
    expect(result).toBeNull();
  });

  it("skips lockfiles whose Content-Length exceeds the 2MB cap", async () => {
    stubFetch({
      "https://raw.githubusercontent.com/owner/repo/main/package-lock.json": {
        body: NPM_V3,
        contentLength: 3 * 1024 * 1024,
      },
    });
    const result = await fetchRepoLockfile({
      owner: "owner",
      repo: "repo",
      ref: "main",
      packageJsonPath: "package.json",
    });
    expect(result).toBeNull();
  });

  it("parses a pnpm lockfile when no package-lock.json exists", async () => {
    stubFetch({
      "https://raw.githubusercontent.com/owner/repo/main/pnpm-lock.yaml": {
        body: PNPM,
      },
    });
    const result = await fetchRepoLockfile({
      owner: "owner",
      repo: "repo",
      ref: "main",
      packageJsonPath: "package.json",
    });
    expect(result?.parsed.format).toBe("pnpm");
    expect(result?.parsed.topLevel.react).toBe("18.2.0");
  });

  it("returns null when the matched file is malformed", async () => {
    stubFetch({
      "https://raw.githubusercontent.com/owner/repo/main/package-lock.json": {
        body: "{ not valid json",
      },
    });
    const result = await fetchRepoLockfile({
      owner: "owner",
      repo: "repo",
      ref: "main",
      packageJsonPath: "package.json",
    });
    expect(result).toBeNull();
  });
});
