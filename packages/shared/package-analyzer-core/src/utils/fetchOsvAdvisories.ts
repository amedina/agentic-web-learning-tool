/**
 * Normalised advisory shape returned by {@link fetchOsvAdvisories}. The
 * shape mirrors the fields `getPackageStats` already consumes from
 * GitHub's `/security-advisories` payload, so the two sources can be
 * merged into one list without per-source branching downstream.
 *
 * `canonicalIds` carries every identifier that should be considered when
 * deduplicating against the GitHub source — typically the GHSA id plus
 * any CVE aliases OSV publishes.
 */
export interface OsvAdvisoryRecord {
  summary: string;
  severity: string;
  html_url: string;
  ghsa_id: string | null;
  canonicalIds: string[];
  vulnerabilities: Array<{
    package: { ecosystem: string; name: string };
    vulnerable_version_range: string;
  }>;
}

export interface OsvVulnerability {
  id?: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  severity?: Array<{ type?: string; score?: string }>;
  affected?: OsvAffected[];
  references?: Array<{ type?: string; url?: string }>;
  database_specific?: { severity?: string };
}

interface OsvAffected {
  package?: { ecosystem?: string; name?: string };
  ranges?: Array<{
    type?: string;
    events?: Array<{
      introduced?: string;
      fixed?: string;
      last_affected?: string;
    }>;
  }>;
}

const osvCache = new Map<string, Promise<OsvAdvisoryRecord[] | null>>();

/**
 * Build a stable cache key for a `(packageName, version)` pair. Treats an
 * undefined version as the all-versions query so callers can hit the same
 * cache slot regardless of whether they passed `undefined` or omitted the
 * argument entirely.
 */
function cacheKeyFor(packageName: string, version?: string): string {
  return `${packageName}@${version ?? "*"}`;
}

/**
 * Query OSV (Open Source Vulnerabilities) for npm-ecosystem advisories
 * affecting a package, optionally narrowed to a specific version. Pairs
 * with the GitHub `/security-advisories` fetch in `getPackageStats` so
 * coverage isn't dependent on a single source.
 *
 * The OSV server filters by version when one is provided, so the returned
 * records all affect that version. When `version` is omitted, every known
 * advisory is returned and the caller is responsible for matching against
 * a considered version via `matchesAdvisoryVersion`.
 *
 * Results are cached in-process by `(packageName, version)`. The cache
 * stores the in-flight promise so concurrent identical requests share
 * one network round-trip. A 404 (OSV reached, nothing on file) resolves
 * to an empty list; a non-OK response or network failure resolves to
 * `null` so the caller (`getPackageStats`) can flag degraded advisory
 * coverage rather than mistaking an outage for a clean result.
 *
 * @param packageName - The npm package to query (scoped or unscoped).
 * @param version - Optional resolved version. When provided, OSV returns
 *   only advisories whose affected ranges cover this version.
 * @returns A list of normalised {@link OsvAdvisoryRecord} entries, or
 *   `null` when OSV was unreachable.
 */
export async function fetchOsvAdvisories(
  packageName: string,
  version?: string,
  signal?: AbortSignal,
): Promise<OsvAdvisoryRecord[] | null> {
  const key = cacheKeyFor(packageName, version);
  const cached = osvCache.get(key);
  if (cached) {
    return raceFetchWithAbort(cached, signal);
  }
  const promise = queryOsv(packageName, version).catch((error) => {
    console.warn(
      `[NPM Advisor] OSV query failed for ${packageName}${version ? `@${version}` : ""}:`,
      error instanceof Error ? error.message : String(error),
    );
    osvCache.delete(key);
    // `null` signals "OSV was unreachable" so the caller can flag degraded
    // advisory coverage, distinct from `[]` which means "OSV reached, no
    // advisories" (a genuine clean result).
    return null;
  });
  osvCache.set(key, promise);
  return raceFetchWithAbort(promise, signal);
}

/**
 * Local race-with-abort helper for the OSV cache. Mirrors the same
 * pattern used by `LruTtlCache`: when the signal aborts, *this caller's*
 * await rejects but the underlying shared promise keeps running so any
 * concurrent caller still receives the value.
 */
function raceFetchWithAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal | undefined,
): Promise<T> {
  if (!signal) {
    return promise;
  }
  if (signal.aborted) {
    return Promise.reject(
      (signal as { reason?: unknown }).reason ??
        new DOMException("The operation was aborted.", "AbortError"),
    );
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(
        (signal as { reason?: unknown }).reason ??
          new DOMException("The operation was aborted.", "AbortError"),
      );
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

/**
 * Clear the in-process OSV response cache. Primarily intended for tests.
 */
export function clearOsvCache(): void {
  osvCache.clear();
}

/**
 * Issue the POST request against OSV and normalise the response into the
 * shape `getPackageStats` consumes. Kept private so the public surface
 * (`fetchOsvAdvisories`) can layer caching and error swallowing around
 * the raw network call.
 */
async function queryOsv(
  packageName: string,
  version?: string,
): Promise<OsvAdvisoryRecord[]> {
  const body = {
    package: { ecosystem: "npm", name: packageName },
    ...(version ? { version } : {}),
  };
  const response = await fetch("https://api.osv.dev/v1/query", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(
      `OSV responded with ${response.status} ${response.statusText}`,
    );
  }
  const json = (await response.json()) as { vulns?: OsvVulnerability[] };
  const vulns = Array.isArray(json?.vulns) ? json.vulns : [];
  return vulns
    .map((vuln) => parseOsvVuln(vuln, packageName))
    .filter((entry): entry is OsvAdvisoryRecord => entry !== null);
}

/**
 * Map a raw OSV vuln entry into the normalised record used downstream.
 * Returns `null` for entries that carry no usable npm-affected payload,
 * so the caller can drop them with a clean filter.
 *
 * Shared between the single-package query path and the batched
 * `fetchOsvAdvisoriesBatch` detail path so both produce identically
 * normalised records from one source of truth.
 *
 * @param vuln - A raw OSV vuln object (from `/v1/query` or `/v1/vulns/{id}`).
 * @param fallbackPackageName - Optional npm package name used when the
 *   vuln carries no `affected[]` payload. The batch detail path omits it
 *   because the OSV detail document already names the affected packages.
 */
export function parseOsvVuln(
  vuln: OsvVulnerability,
  fallbackPackageName?: string,
): OsvAdvisoryRecord | null {
  const summary =
    vuln.summary?.trim() || vuln.details?.split("\n")[0]?.trim() || "N/A";
  const severity = deriveSeverity(vuln);
  const htmlUrl = pickAdvisoryUrl(vuln);
  const ghsaId = pickGhsaId(vuln);
  const canonicalIds = collectCanonicalIds(vuln);
  const vulnerabilities = buildVulnerabilities(vuln, fallbackPackageName);
  if (vulnerabilities.length === 0) {
    return null;
  }
  return {
    summary,
    severity,
    html_url: htmlUrl,
    ghsa_id: ghsaId,
    canonicalIds,
    vulnerabilities,
  };
}

/**
 * Choose a severity label compatible with the existing severity buckets
 * (critical / high / moderate / low / unknown). Prefers the explicit
 * GitHub-style severity exposed under `database_specific.severity`, then
 * falls back to mapping the CVSS base score, then "unknown".
 */
function deriveSeverity(vuln: OsvVulnerability): string {
  const explicit = vuln.database_specific?.severity;
  if (typeof explicit === "string" && explicit.trim().length > 0) {
    const lowered = explicit.trim().toLowerCase();
    if (
      lowered === "critical" ||
      lowered === "high" ||
      lowered === "moderate" ||
      lowered === "low"
    ) {
      return lowered;
    }
    if (lowered === "medium") {
      return "moderate";
    }
  }
  const cvss = Array.isArray(vuln.severity) ? vuln.severity[0] : undefined;
  if (cvss?.score) {
    const score = parseCvssBaseScore(cvss.score);
    if (score !== null) {
      if (score >= 9) return "critical";
      if (score >= 7) return "high";
      if (score >= 4) return "moderate";
      return "low";
    }
  }
  return "unknown";
}

/**
 * Pull the base score out of a CVSS vector string when one is present.
 * OSV usually publishes the vector (e.g. `CVSS:3.1/AV:N/AC:L/...`), not a
 * pre-computed score. Returns `null` when the input doesn't include the
 * `/BS:<n>` numeric suffix some sources tack on.
 */
function parseCvssBaseScore(input: string): number | null {
  const match = input.match(/\/BS:([0-9.]+)/);
  if (match) {
    const value = parseFloat(match[1]);
    return Number.isFinite(value) ? value : null;
  }
  const direct = parseFloat(input);
  return Number.isFinite(direct) ? direct : null;
}

/**
 * Prefer a GitHub advisory URL when OSV references one — those URLs are
 * already what we link to from the rest of the UI. Falls back to the
 * primary OSV URL when no GitHub reference is provided.
 */
function pickAdvisoryUrl(vuln: OsvVulnerability): string {
  const refs = Array.isArray(vuln.references) ? vuln.references : [];
  const github = refs.find(
    (ref) =>
      typeof ref?.url === "string" &&
      /github\.com\/advisories\/GHSA-/i.test(ref.url),
  );
  if (github?.url) {
    return github.url;
  }
  const advisory = refs.find(
    (ref) => ref?.type === "ADVISORY" && typeof ref.url === "string",
  );
  if (advisory?.url) {
    return advisory.url;
  }
  if (vuln.id) {
    return `https://osv.dev/vulnerability/${vuln.id}`;
  }
  return "";
}

/**
 * Identify the GHSA id for a vuln when one is available — either as the
 * primary id or among the aliases. Used so dedup against the GitHub
 * source can use the same key as GitHub's `ghsa_id` field.
 */
function pickGhsaId(vuln: OsvVulnerability): string | null {
  const candidates = [vuln.id, ...(vuln.aliases ?? [])];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && /^GHSA-/i.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Build the set of identifiers (primary id + aliases) that should match
 * the same finding from another source. Lowercased for case-insensitive
 * comparison; downstream dedup uses a Set keyed on these strings.
 */
function collectCanonicalIds(vuln: OsvVulnerability): string[] {
  const ids = new Set<string>();
  for (const candidate of [vuln.id, ...(vuln.aliases ?? [])]) {
    if (typeof candidate === "string" && candidate.length > 0) {
      ids.add(candidate.toLowerCase());
    }
  }
  return [...ids];
}

/**
 * Convert OSV's `affected[].ranges` entries into GitHub-style
 * `vulnerable_version_range` strings keyed by package. Falls back to a
 * single permissive range when no SEMVER range is provided, so the
 * advisory still counts once `matchesAdvisoryVersion` runs the
 * version-aware filter.
 */
function buildVulnerabilities(
  vuln: OsvVulnerability,
  fallbackPackageName?: string,
): OsvAdvisoryRecord["vulnerabilities"] {
  const affected = Array.isArray(vuln.affected) ? vuln.affected : [];
  const out: OsvAdvisoryRecord["vulnerabilities"] = [];
  if (affected.length === 0) {
    if (fallbackPackageName) {
      out.push({
        package: { ecosystem: "npm", name: fallbackPackageName },
        vulnerable_version_range: ">= 0.0.0",
      });
    }
    return out;
  }
  for (const entry of affected) {
    const ecosystem = entry.package?.ecosystem ?? "npm";
    const name = entry.package?.name ?? fallbackPackageName;
    if (ecosystem.toLowerCase() !== "npm" || !name) {
      continue;
    }
    const ranges = Array.isArray(entry.ranges) ? entry.ranges : [];
    const builtRanges = ranges
      .filter((range) => range.type === "SEMVER")
      .map((range) => buildSemverRange(range.events ?? []))
      .filter((range): range is string => range !== null);
    if (builtRanges.length === 0) {
      out.push({
        package: { ecosystem, name },
        vulnerable_version_range: ">= 0.0.0",
      });
      continue;
    }
    for (const range of builtRanges) {
      out.push({
        package: { ecosystem, name },
        vulnerable_version_range: range,
      });
    }
  }
  return out;
}

/**
 * Walk one OSV SEMVER range's events list and build a GHSA-style range
 * string like `">= 1.0.0, < 1.2.3"`. Returns `null` when no introduced
 * event is present and no fixed/last_affected boundary can be derived —
 * such entries are skipped rather than synthesised.
 */
function buildSemverRange(
  events: Array<{
    introduced?: string;
    fixed?: string;
    last_affected?: string;
  }>,
): string | null {
  const parts: string[] = [];
  for (const event of events) {
    if (typeof event.introduced === "string" && event.introduced.length > 0) {
      const lower = event.introduced === "0" ? "0.0.0" : event.introduced;
      parts.push(`>= ${lower}`);
    }
    if (typeof event.fixed === "string" && event.fixed.length > 0) {
      parts.push(`< ${event.fixed}`);
    } else if (
      typeof event.last_affected === "string" &&
      event.last_affected.length > 0
    ) {
      parts.push(`<= ${event.last_affected}`);
    }
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.join(", ");
}
