/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchOsvAdvisories, clearOsvCache } from "../fetchOsvAdvisories";

beforeEach(() => {
  clearOsvCache();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Stub `global.fetch` to return the provided response object. Vitest
 * doesn't have HTTP interception; this is the lightest possible stand-in.
 */
function stubFetch(response: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  body?: unknown;
}) {
  const json = vi.fn().mockResolvedValue(response.body ?? { vulns: [] });
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    statusText: response.statusText ?? "OK",
    json,
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, json };
}

describe("fetchOsvAdvisories", () => {
  it("POSTs the npm package name and version to api.osv.dev", async () => {
    const { fetchMock } = stubFetch({ body: { vulns: [] } });
    await fetchOsvAdvisories("lodash", "4.17.20");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.osv.dev/v1/query",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          package: { ecosystem: "npm", name: "lodash" },
          version: "4.17.20",
        }),
      }),
    );
  });

  it("omits the version field when no version is provided", async () => {
    const { fetchMock } = stubFetch({ body: { vulns: [] } });
    await fetchOsvAdvisories("lodash");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.osv.dev/v1/query",
      expect.objectContaining({
        body: JSON.stringify({
          package: { ecosystem: "npm", name: "lodash" },
        }),
      }),
    );
  });

  it("normalises a vuln into the GitHub-compatible advisory shape", async () => {
    stubFetch({
      body: {
        vulns: [
          {
            id: "GHSA-1234-abcd-efgh",
            summary: "Prototype pollution",
            aliases: ["CVE-2024-0001"],
            severity: [],
            database_specific: { severity: "HIGH" },
            references: [
              {
                type: "ADVISORY",
                url: "https://github.com/advisories/GHSA-1234-abcd-efgh",
              },
            ],
            affected: [
              {
                package: { ecosystem: "npm", name: "lodash" },
                ranges: [
                  {
                    type: "SEMVER",
                    events: [{ introduced: "0" }, { fixed: "4.17.21" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const result = await fetchOsvAdvisories("lodash");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      summary: "Prototype pollution",
      severity: "high",
      html_url: "https://github.com/advisories/GHSA-1234-abcd-efgh",
      ghsa_id: "GHSA-1234-abcd-efgh",
      canonicalIds: expect.arrayContaining([
        "ghsa-1234-abcd-efgh",
        "cve-2024-0001",
      ]),
      vulnerabilities: [
        {
          package: { ecosystem: "npm", name: "lodash" },
          vulnerable_version_range: ">= 0.0.0, < 4.17.21",
        },
      ],
    });
  });

  it("drops vulns whose only affected ecosystem is non-npm", async () => {
    stubFetch({
      body: {
        vulns: [
          {
            id: "GHSA-xxxx",
            affected: [
              {
                package: { ecosystem: "PyPI", name: "django" },
                ranges: [
                  {
                    type: "SEMVER",
                    events: [{ introduced: "0" }, { fixed: "4.0.0" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const result = await fetchOsvAdvisories("lodash");
    expect(result).toHaveLength(0);
  });

  it("returns empty list on a non-OK response without throwing", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Internal Server Error" });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await fetchOsvAdvisories("lodash");
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("returns empty list when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await fetchOsvAdvisories("lodash");
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("shares one in-flight request between concurrent identical calls", async () => {
    const { fetchMock } = stubFetch({ body: { vulns: [] } });
    await Promise.all([
      fetchOsvAdvisories("lodash", "4.17.20"),
      fetchOsvAdvisories("lodash", "4.17.20"),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns a GitHub advisory URL when one is referenced", async () => {
    stubFetch({
      body: {
        vulns: [
          {
            id: "GHSA-xxxx",
            references: [
              { type: "REPORT", url: "https://example.com/report" },
              {
                type: "ADVISORY",
                url: "https://github.com/advisories/GHSA-xxxx",
              },
            ],
            affected: [
              {
                package: { ecosystem: "npm", name: "foo" },
                ranges: [
                  {
                    type: "SEMVER",
                    events: [{ introduced: "0" }, { fixed: "1.0.0" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const result = await fetchOsvAdvisories("foo");
    expect(result[0]?.html_url).toBe("https://github.com/advisories/GHSA-xxxx");
  });

  it("falls back to an OSV URL when no advisory reference is given", async () => {
    stubFetch({
      body: {
        vulns: [
          {
            id: "GO-2024-xxxx",
            affected: [
              {
                package: { ecosystem: "npm", name: "foo" },
                ranges: [
                  {
                    type: "SEMVER",
                    events: [{ introduced: "0" }, { fixed: "1.0.0" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const result = await fetchOsvAdvisories("foo");
    expect(result[0]?.html_url).toBe(
      "https://osv.dev/vulnerability/GO-2024-xxxx",
    );
  });
});
