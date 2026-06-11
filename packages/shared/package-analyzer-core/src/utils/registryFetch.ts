/**
 * Internal dependencies.
 */
import { fetchWithCache, UpstreamFetchError } from "./fetchWithCache";

/**
 * Registry bases tried in order when resolving package metadata. The npm
 * registry is primary; the others are drop-in mirrors that serve the identical
 * packument JSON, so a 429 or outage at npmjs.org can transparently fall
 * through to them. Keep this list in sync with the npm-advisor extension
 * manifest's `host_permissions` — the service worker can only fetch hosts
 * listed there.
 */
export const REGISTRY_BASES = [
  "https://registry.npmjs.org",
  "https://registry.yarnpkg.com",
  "https://registry.npmmirror.com",
] as const;

/**
 * How long a non-primary base stays "preferred" after we fall back to it.
 * During an npmjs.org outage this stops every call (the dependency tree fans
 * out into dozens) from first paying a failing primary round-trip before the
 * fallback succeeds. The window is anchored to the moment of fallback, not
 * refreshed on each hit, so the chain re-probes the primary roughly once per
 * window and returns to npmjs.org as soon as it recovers.
 */
const PREFERRED_BASE_TTL_MS = 60_000;

let preferredBaseIndex = 0;
let preferredBaseSetAt = 0;

/**
 * Returns the registry bases paired with their canonical index, ordered so the
 * most recently successful non-primary base is tried first while its preference
 * window is live; otherwise the canonical primary-first order.
 */
function orderedBases(): Array<{ base: string; index: number }> {
  const indexed = REGISTRY_BASES.map((base, index) => ({ base, index }));
  const preferenceLive =
    preferredBaseIndex > 0 &&
    Date.now() - preferredBaseSetAt < PREFERRED_BASE_TTL_MS;
  if (preferenceLive) {
    return [
      ...indexed.slice(preferredBaseIndex),
      ...indexed.slice(0, preferredBaseIndex),
    ];
  }
  return indexed;
}

/**
 * Records which base just served a request so subsequent calls start there.
 * The window timestamp is only reset when the preferred base actually changes,
 * so a sustained run against one mirror doesn't keep pushing the re-probe of
 * npmjs.org indefinitely into the future.
 */
function rememberPreferredBase(index: number): void {
  if (index === preferredBaseIndex) {
    return;
  }
  preferredBaseIndex = index;
  preferredBaseSetAt = Date.now();
}

/**
 * Fetch an npm-registry path, falling back across {@link REGISTRY_BASES} when a
 * base is rate-limited (429), errors, or is unreachable. A 404 from a base is
 * treated as definitive (the package/version genuinely doesn't exist) and
 * returned as `null` without trying further mirrors.
 *
 * @param path - Registry path beginning with `/`, e.g. `/react` or
 *   `/react/18.2.0`. Scoped names keep their `@scope/` prefix.
 * @param signal - Optional abort signal. If the caller aborts, the rejection
 *   propagates immediately rather than falling through to a mirror.
 * @returns The parsed JSON body, or `null` for a 404.
 * @throws The last error encountered when every base fails. A rate-limit
 *   ({@link UpstreamFetchError} with status 429) seen at any base is preferred
 *   as the thrown error so callers can still surface the rate-limit message.
 */
export async function fetchFromRegistry(
  path: string,
  signal?: AbortSignal,
): Promise<unknown> {
  let lastError: unknown;
  let rateLimitError: UpstreamFetchError | undefined;

  for (const { base, index } of orderedBases()) {
    try {
      const result = await fetchWithCache(`${base}${path}`, undefined, signal);
      rememberPreferredBase(index);
      return result;
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      if (error instanceof UpstreamFetchError && error.isRateLimited) {
        rateLimitError = error;
      }
      lastError = error;
    }
  }

  throw rateLimitError ?? lastError;
}

/**
 * Test-only escape hatch. Resets the sticky base preference so unit tests start
 * from the canonical primary-first order.
 */
export function __resetRegistryPreferenceForTests(): void {
  preferredBaseIndex = 0;
  preferredBaseSetAt = 0;
}
