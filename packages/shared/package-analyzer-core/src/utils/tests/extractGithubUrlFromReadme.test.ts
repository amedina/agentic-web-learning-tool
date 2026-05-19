/**
 * External dependencies.
 */
import { describe, it, expect } from "vitest";

/**
 * Internal dependencies.
 */
import { extractGithubUrlFromReadme } from "../extractGithubUrlFromReadme";

describe("extractGithubUrlFromReadme", () => {
  it("returns null for non-string input", () => {
    expect(extractGithubUrlFromReadme(undefined)).toBeNull();
    expect(extractGithubUrlFromReadme(null)).toBeNull();
    expect(extractGithubUrlFromReadme(42)).toBeNull();
    expect(extractGithubUrlFromReadme({})).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractGithubUrlFromReadme("")).toBeNull();
  });

  it("returns null when the string contains no github.com URL", () => {
    expect(
      extractGithubUrlFromReadme(
        "# My Package\n\nDocs at https://example.com/docs.",
      ),
    ).toBeNull();
  });

  it("extracts the repo from a bare github blob URL (the @rtcamp/frappe-ui-react case)", () => {
    expect(
      extractGithubUrlFromReadme(
        "https://github.com/rtCamp/frappe-ui-react/blob/main/packages/frappe-ui-react/README.md",
      ),
    ).toBe("https://github.com/rtCamp/frappe-ui-react");
  });

  it("strips a trailing .git suffix", () => {
    expect(
      extractGithubUrlFromReadme("https://github.com/axios/axios.git"),
    ).toBe("https://github.com/axios/axios");
  });

  it("extracts the first repo URL from markdown content", () => {
    const readme = `# react

[![npm](https://img.shields.io/npm/v/react.svg)](https://www.npmjs.com/package/react)

Source: https://github.com/facebook/react

See also https://github.com/facebook/react-native for mobile.`;
    expect(extractGithubUrlFromReadme(readme)).toBe(
      "https://github.com/facebook/react",
    );
  });

  it("skips github.com URLs that don't point to a repo (sponsors, orgs, marketplace, topics)", () => {
    const readme = `Support us on https://github.com/sponsors/foo!
Browse https://github.com/marketplace/actions/bar.
Real repo: https://github.com/foo/bar-lib`;
    expect(extractGithubUrlFromReadme(readme)).toBe(
      "https://github.com/foo/bar-lib",
    );
  });

  it("handles URLs embedded in markdown link syntax", () => {
    expect(
      extractGithubUrlFromReadme(
        "Check the [repo](https://github.com/owner/repo) for more info.",
      ),
    ).toBe("https://github.com/owner/repo");
  });

  it("handles URLs surrounded by HTML attributes", () => {
    expect(
      extractGithubUrlFromReadme(
        '<a href="https://github.com/owner/repo">repo</a>',
      ),
    ).toBe("https://github.com/owner/repo");
  });

  it("ignores trailing punctuation in URLs", () => {
    expect(
      extractGithubUrlFromReadme(
        "Repo at https://github.com/owner/repo, more info follows.",
      ),
    ).toBe("https://github.com/owner/repo");
  });

  it("is case-insensitive on hostname", () => {
    expect(
      extractGithubUrlFromReadme("https://GitHub.com/Owner/Repo/blob/main"),
    ).toBe("https://github.com/Owner/Repo");
  });
});
