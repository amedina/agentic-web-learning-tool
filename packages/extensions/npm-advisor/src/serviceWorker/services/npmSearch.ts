/**
 * Internal dependencies
 */
import { NPM_SEARCH_CONFIG } from "../../constants";

/** Parameters accepted by the npm search service. */
interface NpmSearchParams {
  query: string;
  page?: number;
  hitsPerPage?: number;
  facetFilters?: Array<string | string[]>;
  numericFilters?: string[];
  filters?: string;
}

/** Normalised search result shape returned to the content-script overlay. */
interface NpmSearchResult {
  hits: unknown[];
  nbPages: number;
  page: number;
  nbHits: number;
  // True when the result came from the registry fallback rather than Algolia,
  // so the overlay can flag that some fields (downloads, stars) are missing.
  degraded?: boolean;
}

// The npm registry search API caps `size` at 250; clamp to stay within it.
const REGISTRY_SEARCH_MAX_SIZE = 250;

/**
 * Search npm packages using Algolia's `npm-search` index — the primary,
 * full-featured backend (download counts, stars, deprecation flags, etc.).
 */
async function searchAlgolia(
  params: NpmSearchParams,
): Promise<NpmSearchResult> {
  const { appId, apiKey, indexName } = NPM_SEARCH_CONFIG;
  const url = `https://${appId.toLowerCase()}-dsn.algolia.net/1/indexes/${indexName}/query`;

  const {
    query,
    page = 0,
    hitsPerPage = 10,
    facetFilters = [],
    numericFilters = [],
    filters = "",
  } = params;

  console.log(
    `[NPM Advisor] Searching for "${query}" (Page ${page}) with filters:`,
    { facetFilters, numericFilters, filters },
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": appId,
      "X-Algolia-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query || "",
      ...(filters && { filters }),
      ...(facetFilters.length > 0 && { facetFilters }),
      ...(numericFilters.length > 0 && { numericFilters }),
      hitsPerPage,
      page,
      attributesToRetrieve: [
        "name",
        "version",
        "description",
        "modified",
        "homepage",
        "repository",
        "owners",
        "downloadsLast30Days",
        "downloadsRatio",
        "stargazers",
        "popular",
        "keywords",
        "deprecated",
        "isDeprecated",
        "license",
        "dependents",
        "owner",
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Algolia search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    hits: data.hits || [],
    nbPages: data.nbPages,
    page: data.page,
    nbHits: data.nbHits,
  };
}

/**
 * Maps one npm registry search `object` into the hit shape the overlay renders
 * (a subset of the Algolia hit). The registry search API exposes far fewer
 * fields than Algolia, so download counts, stars, license, and deprecation are
 * simply absent — the overlay tolerates the missing values.
 */
function adaptRegistrySearchObject(object: any): Record<string, unknown> {
  const pkg = object?.package ?? {};
  const links = pkg.links ?? {};
  return {
    objectID: pkg.name,
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    modified: pkg.date,
    homepage: links.homepage,
    repository: links.repository ? { url: links.repository } : undefined,
    keywords: pkg.keywords,
    owner: pkg.publisher?.username
      ? { name: pkg.publisher.username }
      : undefined,
  };
}

/**
 * Fallback search against the npm registry's `/-/v1/search` endpoint on a
 * mirror (npmmirror), used when Algolia is unavailable or over quota. Returns a
 * degraded-but-usable result so the search overlay keeps working during an
 * outage.
 */
async function searchRegistryFallback(
  params: NpmSearchParams,
): Promise<NpmSearchResult> {
  const { query, page = 0, hitsPerPage = 10 } = params;

  // The registry search endpoint requires a text query; with none there is
  // nothing meaningful to return (Algolia would have surfaced popular packages
  // here, which the registry API can't replicate).
  if (!query) {
    return { hits: [], nbPages: 0, page, nbHits: 0, degraded: true };
  }

  const size = Math.min(Math.max(hitsPerPage, 1), REGISTRY_SEARCH_MAX_SIZE);
  const from = page * size;
  const url = `https://registry.npmmirror.com/-/v1/search?text=${encodeURIComponent(
    query,
  )}&size=${size}&from=${from}`;

  console.log(`[NPM Advisor] Falling back to registry search for "${query}".`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Registry search failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  const objects = Array.isArray(data.objects) ? data.objects : [];
  const total = typeof data.total === "number" ? data.total : objects.length;

  return {
    hits: objects.map(adaptRegistrySearchObject),
    nbPages: Math.max(1, Math.ceil(total / size)),
    page,
    nbHits: total,
  };
}

/**
 * NPM Search Service.
 * Searches via Algolia, falling back to the npm registry search when Algolia
 * is unavailable so the overlay keeps returning results during an outage.
 */
export const npmSearchService = {
  /**
   * Search npm packages. Tries Algolia first; on failure, falls back to the
   * registry search and tags the result `degraded`. Only if both backends fail
   * does it surface the original Algolia error.
   */
  async search(params: NpmSearchParams): Promise<NpmSearchResult> {
    try {
      return await searchAlgolia(params);
    } catch (algoliaError) {
      console.warn(
        "[NPM Advisor] Algolia search failed; falling back to the npm registry search:",
        algoliaError,
      );
      try {
        const fallback = await searchRegistryFallback(params);
        return { ...fallback, degraded: true };
      } catch (registryError) {
        console.error(
          "[NPM Advisor] Registry search fallback also failed:",
          registryError,
        );
        throw algoliaError;
      }
    }
  },
};
