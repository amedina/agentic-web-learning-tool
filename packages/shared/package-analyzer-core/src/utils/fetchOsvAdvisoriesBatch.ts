/**
 * Internal dependencies.
 */
import {
  parseOsvVuln,
  type OsvAdvisoryRecord,
  type OsvVulnerability,
} from "./fetchOsvAdvisories";

/**
 * Maximum number of queries OSV accepts in a single `/v1/querybatch`
 * request. Larger inputs are split into several requests and the results
 * concatenated back together in order.
 */
const OSV_BATCH_LIMIT = 1000;

/**
 * How long a single OSV request is allowed to run before it is aborted.
 * Mirrors the best-effort timeout style used elsewhere in this package so
 * a hung connection can't stall the whole batch.
 */
const OSV_REQUEST_TIMEOUT_MS = 30000;

/**
 * One query in the batch input: an npm package name plus an optional
 * resolved version. When a version is supplied OSV only reports advisories
 * whose affected ranges cover it.
 */
export interface OsvBatchQuery {
  name: string;
  version?: string;
}

interface OsvQueryBatchResult {
  vulns?: Array<{ id?: string; modified?: string }>;
}

interface OsvQueryBatchResponse {
  results?: OsvQueryBatchResult[];
}

/**
 * Check a whole batch of npm packages against OSV in a handful of requests
 * instead of one request per package, using OSV's `/v1/querybatch`
 * endpoint.
 *
 * The querybatch response is intentionally minimal: it returns only vuln
 * ids per query, aligned by index to the input. To produce full
 * {@link OsvAdvisoryRecord} entries this collects the unique set of vuln
 * ids across the entire batch, fetches each id's detail exactly once via
 * `/v1/vulns/{id}`, parses it with the same {@link parseOsvVuln} helper the
 * single-package path uses, then maps each query's id list back to its
 * parsed records preserving input order. Deduplicating the detail fetches
 * across the whole batch is the efficiency win: an advisory shared by a
 * hundred packages is fetched only once.
 *
 * Return value, aligned by index to `queries`:
 *  - `null` when the querybatch request covering that query failed
 *    (network, timeout, or non-OK response), so the caller can flag
 *    degraded coverage rather than mistake an outage for a clean result.
 *  - `[]` when OSV reported no vulns for that query.
 *  - `OsvAdvisoryRecord[]` otherwise. A query whose individual vuln-detail
 *    fetch fails simply omits that record (best-effort); it does not fail
 *    the whole batch.
 *
 * @param queries - The npm packages to check, each with an optional version.
 * @param signal - Optional caller abort signal. When it aborts, in-flight
 *   OSV requests are aborted too.
 * @returns A per-query array of normalised records, or `null` per query
 *   when the batch request covering it was unreachable.
 */
export async function fetchOsvAdvisoriesBatch(
  queries: Array<{ name: string; version?: string }>,
  signal?: AbortSignal,
): Promise<Array<OsvAdvisoryRecord[] | null>> {
  if (queries.length === 0) {
    return [];
  }
  const idLists: Array<string[] | null> = [];
  for (let offset = 0; offset < queries.length; offset += OSV_BATCH_LIMIT) {
    const chunk = queries.slice(offset, offset + OSV_BATCH_LIMIT);
    const chunkIdLists = await queryOsvBatch(chunk, signal);
    idLists.push(...chunkIdLists);
  }
  const detailsById = await fetchUniqueVulnDetails(idLists, signal);
  return idLists.map((ids) => {
    if (ids === null) {
      return null;
    }
    const records: OsvAdvisoryRecord[] = [];
    for (const id of ids) {
      const record = detailsById.get(id);
      if (record) {
        records.push(record);
      }
    }
    return records;
  });
}

/**
 * POST a single chunk (at most {@link OSV_BATCH_LIMIT} queries) to
 * `/v1/querybatch` and return the per-query list of vuln ids. Returns a
 * `null` slot for every query in the chunk when the request itself failed,
 * so the caller can surface degraded coverage for exactly those queries.
 *
 * @param chunk - The slice of queries to send in one request.
 * @param signal - Optional caller abort signal.
 * @returns Per-query vuln-id lists for this chunk, or `null` per query on
 *   request failure.
 */
async function queryOsvBatch(
  chunk: OsvBatchQuery[],
  signal: AbortSignal | undefined,
): Promise<Array<string[] | null>> {
  const body = {
    queries: chunk.map((query) => ({
      package: { ecosystem: "npm", name: query.name },
      ...(query.version ? { version: query.version } : {}),
    })),
  };
  try {
    const response = await fetchWithTimeout(
      "https://api.osv.dev/v1/querybatch",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      },
      signal,
    );
    if (!response.ok) {
      throw new Error(
        `OSV responded with ${response.status} ${response.statusText}`,
      );
    }
    const json = (await response.json()) as OsvQueryBatchResponse;
    const results = Array.isArray(json?.results) ? json.results : [];
    return chunk.map((_query, index) => {
      const vulns = results[index]?.vulns;
      if (!Array.isArray(vulns)) {
        return [];
      }
      return vulns
        .map((vuln) => vuln?.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
    });
  } catch (error) {
    console.warn(
      "[NPM Advisor] OSV batch query failed:",
      error instanceof Error ? error.message : String(error),
    );
    return chunk.map(() => null);
  }
}

/**
 * Fetch the full detail document for every unique vuln id referenced
 * across the batch, parsing each into an {@link OsvAdvisoryRecord}. Each id
 * is fetched at most once regardless of how many queries reference it.
 * Individual detail failures are swallowed (the id is left out of the map)
 * so one bad advisory never fails the whole batch.
 *
 * @param idLists - The per-query id lists produced by the querybatch step.
 * @param signal - Optional caller abort signal.
 * @returns A map from vuln id to its parsed record.
 */
async function fetchUniqueVulnDetails(
  idLists: Array<string[] | null>,
  signal: AbortSignal | undefined,
): Promise<Map<string, OsvAdvisoryRecord>> {
  const uniqueIds = new Set<string>();
  for (const ids of idLists) {
    if (ids === null) {
      continue;
    }
    for (const id of ids) {
      uniqueIds.add(id);
    }
  }
  const detailsById = new Map<string, OsvAdvisoryRecord>();
  await Promise.all(
    [...uniqueIds].map(async (id) => {
      const record = await fetchVulnDetail(id, signal);
      if (record) {
        detailsById.set(id, record);
      }
    }),
  );
  return detailsById;
}

/**
 * GET a single vuln's full detail document and parse it into a normalised
 * record. Returns `null` when the request fails or the payload carries no
 * usable npm-affected data, so the caller can drop it best-effort.
 *
 * @param id - The OSV vuln id (for example `GHSA-xxxx` or `CVE-2024-0001`).
 * @param signal - Optional caller abort signal.
 * @returns The parsed record, or `null` on failure.
 */
async function fetchVulnDetail(
  id: string,
  signal: AbortSignal | undefined,
): Promise<OsvAdvisoryRecord | null> {
  try {
    const response = await fetchWithTimeout(
      `https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
      signal,
    );
    if (!response.ok) {
      return null;
    }
    const vuln = (await response.json()) as OsvVulnerability;
    return parseOsvVuln(vuln);
  } catch (error) {
    console.warn(
      `[NPM Advisor] OSV vuln detail fetch failed for ${id}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Run `fetch` with a best-effort timeout, honouring the caller's abort
 * signal when one is provided. Combines the caller signal with an internal
 * timeout signal so whichever fires first aborts the request. Mirrors the
 * abort-aware approach used elsewhere in this package.
 *
 * @param url - The request URL.
 * @param init - The fetch init, sans `signal` (this function owns it).
 * @param signal - Optional caller abort signal to combine with the timeout.
 * @returns The fetch response.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  signal: AbortSignal | undefined,
): Promise<Response> {
  const controller = new AbortController();
  const onAbort = () => {
    controller.abort(
      (signal as { reason?: unknown } | undefined)?.reason ??
        new DOMException("The operation was aborted.", "AbortError"),
    );
  };
  if (signal) {
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }
  const timeout = setTimeout(() => {
    controller.abort(
      new DOMException("OSV request timed out.", "TimeoutError"),
    );
  }, OSV_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener("abort", onAbort);
    }
  }
}
