/**
 * External dependencies
 */
import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

/**
 * Internal dependencies
 */
import { FilterSidebar } from "./components/filterSidebar";
import { ResultCard } from "./components/resultCard";
import { ResultsHeader } from "./components/resultsHeader";
import { useThemeSync } from "../hooks/useThemeSync";
import { calculateScore } from "../../lib";
import type { AlgoliaHit, SearchFilters } from "../types";

const DEFAULT_FILTERS: SearchFilters = {
  minDownloads: null,
  lastUpdated: null,
  notDeprecated: true,
  hasTypes: false,
  moduleEsm: false,
  licenseMit: false,
  hasHomepage: false,
  hasRepo: false,
  ranking: "optimal",
};

/**
 * Full-page takeover for npmjs.com/search.
 */
export const SearchResults: React.FC = () => {
  const isDark = useThemeSync();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AlgoliaHit[]>([]);
  const [nbHits, setNbHits] = useState(0);
  const [page, setPage] = useState(0);
  const [nbPages, setNbPages] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [comparisonBucket, setComparisonBucket] = useState<
    Record<string, unknown>[]
  >([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1280);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
      if (event.matches) {
        setIsSidebarOpen(false);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    chrome.storage.local.get(["comparisonBucket"], (res) => {
      setComparisonBucket(
        (res.comparisonBucket as Record<string, unknown>[]) || [],
      );
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      if (changes.comparisonBucket) {
        setComparisonBucket(
          (changes.comparisonBucket.newValue as Record<string, unknown>[]) ||
            [],
        );
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const newQuery = params.get("q") || "";
      const newPage = parseInt(params.get("page") || "0", 10);
      const newRanking = params.get("ranking") || "optimal";

      setQuery(newQuery);
      setPage(newPage);
      setFilters((f) => ({ ...f, ranking: newRanking }));
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  // Keep the URL in sync with state using replaceState to avoid polluting history
  // on initial load or filter changes; pagination uses the same approach since
  // the back button restores the previous query via popstate → syncFromUrl.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQ = params.get("q") || "";
    const urlPage = parseInt(params.get("page") || "0", 10);
    const urlRanking = params.get("ranking") || "optimal";

    if (query !== urlQ || page !== urlPage || filters.ranking !== urlRanking) {
      const newParams = new URLSearchParams();
      if (query) newParams.set("q", query);
      if (page > 0) newParams.set("page", page.toString());
      if (filters.ranking !== "optimal")
        newParams.set("ranking", filters.ranking);

      window.history.replaceState(
        { query, page, ranking: filters.ranking },
        "",
        `${window.location.pathname}?${newParams.toString()}`,
      );
    }
  }, [query, page, filters.ranking]);

  const performSearch = useCallback(async () => {
    if (!query) return;
    setIsFetching(true);
    setError(null);

    const numericFilters: string[] = [];
    if (filters.minDownloads) {
      numericFilters.push(`downloadsLast30Days > ${filters.minDownloads}`);
    }
    if (filters.lastUpdated) {
      const now = Date.now();
      const ms = filters.lastUpdated * 24 * 60 * 60 * 1000;
      numericFilters.push(`modified > ${now - ms}`);
    }

    const categoricalFilters: Array<string | string[]> = [];
    if (filters.notDeprecated) {
      categoricalFilters.push("isDeprecated:false");
    }
    if (filters.hasTypes) {
      categoricalFilters.push([
        "types.ts:included",
        "types.ts:definitely-typed",
      ]);
    }
    if (filters.moduleEsm) {
      categoricalFilters.push("moduleTypes:esm");
    }

    const isCustomSort = filters.ranking !== "optimal";
    const isClientSideMode =
      isCustomSort ||
      filters.licenseMit ||
      filters.hasHomepage ||
      filters.hasRepo;

    const fetchPage = isClientSideMode ? 0 : page;
    const fetchHitsPerPage = isClientSideMode ? 500 : 20;

    chrome.runtime.sendMessage(
      {
        type: "SEARCH_NPM",
        query,
        page: fetchPage,
        hitsPerPage: fetchHitsPerPage,
        facetFilters: categoricalFilters,
        numericFilters,
      },
      (response) => {
        setIsFetching(false);
        if (response && response.success) {
          let finalHits: AlgoliaHit[] = response.hits || [];

          if (isClientSideMode) {
            // Client-Side Reductions
            if (filters.licenseMit) {
              finalHits = finalHits.filter((h) => h.license === "MIT");
            }
            if (filters.hasHomepage) {
              finalHits = finalHits.filter((h) => !!h.homepage);
            }
            if (filters.hasRepo) {
              finalHits = finalHits.filter((h) => !!h.repository?.url);
            }

            // Client-Side Sorting
            if (isCustomSort) {
              finalHits.sort((a, b) => {
                let valA = 0;
                let valB = 0;

                if (filters.ranking === "popularity") {
                  valA = a.downloadsLast30Days || 0;
                  valB = b.downloadsLast30Days || 0;
                } else if (filters.ranking === "maintenance") {
                  valA = a.modified ? new Date(a.modified).getTime() : 0;
                  valB = b.modified ? new Date(b.modified).getTime() : 0;
                } else if (filters.ranking === "advisor") {
                  const findScore = (h: AlgoliaHit) => {
                    const match = comparisonBucket.find(
                      (pkg) =>
                        pkg.packageName === h.name || pkg.name === h.name,
                    );
                    return match ? (calculateScore(match) ?? 0) : null;
                  };
                  const scoreA = findScore(a);
                  const scoreB = findScore(b);

                  if (scoreA !== null && scoreB !== null) {
                    return sortOrder === "desc"
                      ? scoreB - scoreA
                      : scoreA - scoreB;
                  }
                  if (scoreA !== null) return -1;
                  if (scoreB !== null) return 1;
                  return 0;
                }

                return sortOrder === "desc" ? valB - valA : valA - valB;
              });
            }
          }

          setHits(finalHits);
          setNbHits(response.nbHits);
          setNbPages(isClientSideMode ? 1 : response.nbPages);
        } else {
          setError(response?.error || "Failed to fetch results");
        }
      },
    );
  }, [query, page, filters, sortOrder, comparisonBucket]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: SearchFilters[keyof SearchFilters],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  };

  return (
    <div className={`flex justify-center ${isDark ? "dark" : ""}`}>
      <div className="flex min-h-screen bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
        {isDesktop ? (
          <div className="sticky top-0 h-screen overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClear={clearFilters}
            />
          </div>
        ) : (
          <>
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/40"
                style={{ zIndex: 9998 }}
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            <div
              className="fixed top-0 left-0 h-full overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              style={{
                zIndex: 9999,
                transform: isSidebarOpen
                  ? "translateX(0)"
                  : "translateX(-100%)",
                transition: "transform 300ms ease-in-out",
              }}
            >
              <div className="flex justify-end p-3">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                >
                  <X size={18} />
                </button>
              </div>
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClear={clearFilters}
              />
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col">
          <ResultsHeader
            query={query}
            hitsCount={hits.length}
            nbHits={nbHits}
            isClientSideMode={isClientSideModeActive(filters)}
            filters={filters}
            sortOrder={sortOrder}
            comparisonBucket={comparisonBucket}
            onFilterChange={handleFilterChange}
            onSortOrderToggle={() =>
              setSortOrder((order) => (order === "desc" ? "asc" : "desc"))
            }
            onOpenFilters={() => setIsSidebarOpen(true)}
          />

          {/* Results Scroll Area */}
          <div id="npc-advisor-results-scroll-container">
            {isFetching && hits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-bold text-zinc-500">
                  Curating the best packages...
                </span>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 font-bold">
                {error}
              </div>
            ) : (
              <div className="xl:w-5xl">
                {hits.map((hit) => (
                  <ResultCard
                    key={hit.objectID || hit.name}
                    hit={hit}
                    query={query}
                  />
                ))}

                {/* Pagination */}
                {nbPages > 1 && (
                  <div className="p-8 flex items-center justify-center gap-2">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-mono px-4">
                      Page {page + 1} of {nbPages}
                    </span>
                    <button
                      disabled={page >= nbPages - 1}
                      onClick={() =>
                        setPage((p) => Math.min(nbPages - 1, p + 1))
                      }
                      className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function isClientSideModeActive(filters: SearchFilters): boolean {
  return (
    filters.ranking !== "optimal" ||
    filters.licenseMit ||
    filters.hasHomepage ||
    filters.hasRepo
  );
}
