import React, { useState, useEffect, useCallback } from "react";
import { FilterSidebar } from "../components/FilterSidebar";
import { ResultCard } from "../components/ResultCard";
import { useThemeSync } from "../hooks/useThemeSync";
import { calculateScore } from "../../utils";

/**
 * Search Results App.
 * Full-page takeover for npmjs.com/search.
 */
export const SearchResultsApp: React.FC = () => {
  const isDark = useThemeSync();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<any[]>([]);
  const [nbHits, setNbHits] = useState(0);
  const [page, setPage] = useState(0);
  const [nbPages, setNbPages] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [filters, setFilters] = useState({
    minDownloads: null as number | null,
    lastUpdated: null as number | null,
    notDeprecated: true,
    hasTypes: false,
    moduleEsm: false,
    licenseMit: false,
    hasHomepage: false,
    hasRepo: false,
    ranking: "optimal",
  });

  const [comparisonBucket, setComparisonBucket] = useState<any[]>([]);

  useEffect(() => {
    chrome.storage.local.get(["comparisonBucket"], (res: any) => {
      setComparisonBucket(res.comparisonBucket || []);
    });

    const listener = (changes: any) => {
      if (changes.comparisonBucket) {
        setComparisonBucket(changes.comparisonBucket.newValue || []);
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

      const newUrl = `${window.location.pathname}?${newParams.toString()}`;
      window.history.pushState(
        { query, page, ranking: filters.ranking },
        "",
        newUrl,
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

    const categoricalFilters: string[] = [];
    if (filters.notDeprecated) {
      categoricalFilters.push("isDeprecated:false");
    }
    if (filters.hasTypes) {
      categoricalFilters.push([
        "types.ts:included",
        "types.ts:definitely-typed",
      ] as any);
    }
    if (filters.moduleEsm) {
      categoricalFilters.push("moduleTypes:esm");
    }

    try {
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
            let finalHits = response.hits || [];

            if (isClientSideMode) {
              // Client-Side Reductions
              if (filters.licenseMit) {
                finalHits = finalHits.filter((h: any) => h.license === "MIT");
              }
              if (filters.hasHomepage) {
                finalHits = finalHits.filter((h: any) => !!h.homepage);
              }
              if (filters.hasRepo) {
                finalHits = finalHits.filter((h: any) => !!h.repository?.url);
              }

              // Client-Side Sorting
              if (isCustomSort) {
                finalHits.sort((a: any, b: any) => {
                  let valA = 0;
                  let valB = 0;

                  if (filters.ranking === "popularity") {
                    valA = a.downloadsLast30Days || 0;
                    valB = b.downloadsLast30Days || 0;
                  } else if (filters.ranking === "maintenance") {
                    valA = a.modified ? new Date(a.modified).getTime() : 0;
                    valB = b.modified ? new Date(b.modified).getTime() : 0;
                  } else if (filters.ranking === "quality") {
                    valA = a.downloadsRatio || 0;
                    valB = b.downloadsRatio || 0;
                  } else if (filters.ranking === "advisor") {
                    const findScore = (h: any) => {
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
    } catch (err: any) {
      setIsFetching(false);
      setError(err.message);
    }
  }, [query, page, filters, sortOrder, comparisonBucket]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      minDownloads: null,
      lastUpdated: null,
      notDeprecated: true,
      hasTypes: false,
      moduleEsm: false,
      licenseMit: false,
      hasHomepage: false,
      hasRepo: false,
      ranking: "optimal",
    });
    setPage(0);
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="flex min-h-screen bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
        <div className="sticky top-0 h-screen overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={clearFilters}
          />
        </div>

        <div className="flex-1 flex flex-col">
          {/* Results Header */}
          <div className="px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm top-0 shrink-0">
            <div>
              <h1 className="text-lg font-bold">
                {filters.ranking !== "optimal" ||
                filters.licenseMit ||
                filters.hasHomepage ||
                filters.hasRepo
                  ? `Showing top ${hits.length} sorted results for `
                  : `${nbHits.toLocaleString()} results for `}
                <span className="italic text-orange-600">"{query}"</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-tighter">
                Sort by:
              </span>
              <div className="flex items-center gap-1">
                <select
                  value={filters.ranking}
                  onChange={(e) =>
                    handleFilterChange("ranking", e.target.value)
                  }
                  className="text-xs font-bold bg-zinc-100 dark:bg-zinc-900 border-none rounded px-3 py-1.5 focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="optimal">Relevance</option>
                  <option value="popularity">Popularity</option>
                  <option value="quality">Quality</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="advisor">Advisor Score</option>
                </select>

                {filters.ranking !== "optimal" && (
                  <button
                    onClick={() =>
                      setSortOrder((o) => (o === "desc" ? "asc" : "desc"))
                    }
                    className="p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    title={`Currently sorting ${sortOrder === "desc" ? "Descending" : "Ascending"}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={
                        sortOrder === "asc"
                          ? "rotate-180 transition-transform"
                          : "transition-transform"
                      }
                    >
                      <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

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
              <div className="max-w-4xl">
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
