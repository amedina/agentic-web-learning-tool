/**
 * External dependencies.
 */
import { algoliasearch } from "algoliasearch";
import { InstantSearch } from "react-instantsearch";

/**
 * Internal dependencies.
 */
import { NPM_SEARCH_CONFIG } from "../../../../../constants";
import { SearchWrapper } from "./searchWrapper";

const searchClient = algoliasearch(
  NPM_SEARCH_CONFIG.appId,
  NPM_SEARCH_CONFIG.apiKey,
);

export default function PackageSearch() {
  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={NPM_SEARCH_CONFIG.indexName}
    >
      <SearchWrapper />
    </InstantSearch>
  );
}
