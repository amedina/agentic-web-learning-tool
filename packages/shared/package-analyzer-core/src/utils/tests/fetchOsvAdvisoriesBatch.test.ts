/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Internal dependencies.
 */
import { fetchOsvAdvisoriesBatch } from "../fetchOsvAdvisoriesBatch";

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Build a fake `Response`-like object that resolves `json()` to `body`.
 */
function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: vi.fn().mockResolvedValue(body),
  };
}

/**
 * Build a full OSV vuln detail document for the `/v1/vulns/{id}` path,
 * shaped enough for `parseOsvVuln` to produce a usable record.
 */
function vulnDetail(id: string, packageName: string) {
  return {
    id,
    summary: `Summary for ${id}`,
    aliases: [`CVE-${id}`],
    database_specific: { severity: "HIGH" },
    references: [
      { type: "ADVISORY", url: `https://github.com/advisories/${id}` },
    ],
    affected: [
      {
        package: { ecosystem: "npm", name: packageName },
        ranges: [
          {
            type: "SEMVER",
            events: [{ introduced: "0" }, { fixed: "1.0.0" }],
          },
        ],
      },
    ],
  };
}

/**
 * Route fetch calls by URL: `/v1/querybatch` POSTs return the supplied
 * querybatch body; `/v1/vulns/{id}` GETs return the matching detail from
 * `details`. Returns the spy so call counts can be asserted.
 */
function stubFetchRouter(options: {
  batchBody: unknown;
  details: Record<string, unknown>;
}) {
  const fetchMock = vi.fn((url: string) => {
    if (url.includes("/v1/querybatch")) {
      return Promise.resolve(jsonResponse(options.batchBody));
    }
    const match = url.match(/\/v1\/vulns\/(.+)$/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      const detail = options.details[id];
      if (detail) {
        return Promise.resolve(jsonResponse(detail));
      }
      return Promise.resolve(jsonResponse({}, false, 404));
    }
    return Promise.resolve(jsonResponse({}, false, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchOsvAdvisoriesBatch", () => {
  it("aligns results by index and parses records for packages with vulns", async () => {
    const fetchMock = stubFetchRouter({
      batchBody: {
        results: [
          { vulns: [{ id: "GHSA-aaaa", modified: "2024-01-01" }] },
          {},
          { vulns: [{ id: "GHSA-bbbb", modified: "2024-02-01" }] },
        ],
      },
      details: {
        "GHSA-aaaa": vulnDetail("GHSA-aaaa", "lodash"),
        "GHSA-bbbb": vulnDetail("GHSA-bbbb", "express"),
      },
    });

    const result = await fetchOsvAdvisoriesBatch([
      { name: "lodash", version: "4.17.20" },
      { name: "left-pad", version: "1.0.0" },
      { name: "express", version: "4.0.0" },
    ]);

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(1);
    expect(result[0]?.[0]).toMatchObject({
      summary: "Summary for GHSA-aaaa",
      severity: "high",
      ghsa_id: "GHSA-aaaa",
      html_url: "https://github.com/advisories/GHSA-aaaa",
      vulnerabilities: [
        {
          package: { ecosystem: "npm", name: "lodash" },
          vulnerable_version_range: ">= 0.0.0, < 1.0.0",
        },
      ],
    });
    expect(result[1]).toEqual([]);
    expect(result[2]?.[0]?.ghsa_id).toBe("GHSA-bbbb");

    const batchCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/v1/querybatch"),
    );
    expect(batchCalls).toHaveLength(1);
  });

  it("fetches a shared vuln id's detail only once across the batch", async () => {
    const fetchMock = stubFetchRouter({
      batchBody: {
        results: [
          { vulns: [{ id: "GHSA-shared" }] },
          { vulns: [{ id: "GHSA-shared" }] },
        ],
      },
      details: {
        "GHSA-shared": vulnDetail("GHSA-shared", "lodash"),
      },
    });

    const result = await fetchOsvAdvisoriesBatch([
      { name: "lodash", version: "1.0.0" },
      { name: "lodash-es", version: "1.0.0" },
    ]);

    expect(result[0]?.[0]?.ghsa_id).toBe("GHSA-shared");
    expect(result[1]?.[0]?.ghsa_id).toBe("GHSA-shared");

    const detailCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/v1/vulns/"),
    );
    expect(detailCalls).toHaveLength(1);
  });

  it("returns null per query when the batch request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchOsvAdvisoriesBatch([
      { name: "lodash" },
      { name: "express" },
    ]);

    expect(result).toEqual([null, null]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("returns null per query on a non-OK batch response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({}, false, 500)),
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchOsvAdvisoriesBatch([{ name: "lodash" }]);

    expect(result).toEqual([null]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("omits a record when its individual detail fetch fails", async () => {
    stubFetchRouter({
      batchBody: {
        results: [{ vulns: [{ id: "GHSA-ok" }, { id: "GHSA-missing" }] }],
      },
      details: {
        "GHSA-ok": vulnDetail("GHSA-ok", "lodash"),
      },
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchOsvAdvisoriesBatch([{ name: "lodash" }]);

    expect(result[0]).toHaveLength(1);
    expect(result[0]?.[0]?.ghsa_id).toBe("GHSA-ok");
  });

  it("chunks more than 1000 queries into multiple querybatch POSTs", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/v1/querybatch")) {
        return Promise.resolve(jsonResponse({ results: [] }));
      }
      return Promise.resolve(jsonResponse({}, false, 404));
    });
    vi.stubGlobal("fetch", fetchMock);

    const queries = Array.from({ length: 2500 }, (_value, index) => ({
      name: `pkg-${index}`,
    }));
    const result = await fetchOsvAdvisoriesBatch(queries);

    expect(result).toHaveLength(2500);
    const batchCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes("/v1/querybatch"),
    );
    expect(batchCalls).toHaveLength(3);
  });

  it("returns an empty array for an empty input without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchOsvAdvisoriesBatch([]);

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
