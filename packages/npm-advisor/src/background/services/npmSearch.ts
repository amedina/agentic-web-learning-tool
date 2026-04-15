import { NPM_SEARCH_CONFIG } from "../../constants";

/**
 * NPM Search Service.
 * Handles communication with Algolia for npm searches.
 */
export const npmSearchService = {
  /**
   * Search npm packages using Algolia.
   */
  async search(params: {
    query: string;
    page?: number;
    hitsPerPage?: number;
    facetFilters?: Array<string | string[]>;
    numericFilters?: string[];
    filters?: string;
  }) {
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
  },
};
