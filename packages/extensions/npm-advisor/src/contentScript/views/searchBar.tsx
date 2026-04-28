/**
 * External dependencies
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Filter, ChevronDown, Check, Search } from "lucide-react";

/**
 * Internal dependencies
 */
import { useThemeSync } from "../hooks/useThemeSync";
import type { AlgoliaHit } from "../types";

/**
 * Replaces the native NPM Search overlay with a React-based implementation.
 */
export const SearchBar: React.FC = () => {
  const isDark = useThemeSync();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AlgoliaHit[]>([]);
  const [nbPages, setNbPages] = useState(0);
  const [page, setPage] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<{
    label: string;
    key: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const searchModes = [
    { label: "Keywords", key: "keywords" },
    { label: "Owner", key: "owner.name" },
  ];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const path = e.composedPath();
      if (containerRef.current && !path.includes(containerRef.current)) {
        setIsVisible(false);
        setIsFilterMenuOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const performSearch = useCallback(
    (targetPage: number) => {
      if (targetPage === 0) {
        setIsFetching(true);
      } else {
        setIsFetchingMore(true);
      }

      chrome.runtime.sendMessage(
        {
          type: "SEARCH_NPM",
          query,
          page: targetPage,
          hitsPerPage: 20,
          facetFilters: activeFilter ? [`${activeFilter.key}:${query}`] : [],
        },
        (response) => {
          setIsFetching(false);
          setIsFetchingMore(false);

          if (response && response.success) {
            if (targetPage === 0) {
              setHits(response.hits);
              setActiveIndex(-1);
            } else {
              setHits((prev) => [...prev, ...response.hits]);
            }
            setNbPages(response.nbPages);
            setIsVisible(true);
          }
        },
      );
    },
    [query, activeFilter],
  );

  // Re-run search when query or active filter mode changes
  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      setIsVisible(false);
      setPage(0);
      setNbPages(0);
      return;
    }

    const timer = setTimeout(() => {
      setPage(0);
      performSearch(0);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeFilter, performSearch]);

  const loadMore = () => {
    if (isFetching || isFetchingMore || page >= nbPages - 1) return;

    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(nextPage);
  };

  const handleScroll = () => {
    if (!resultsContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      resultsContainerRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      loadMore();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && resultsContainerRef.current) {
      const container = resultsContainerRef.current;
      const activeElement = container.children[activeIndex] as HTMLElement;

      if (activeElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = activeElement.getBoundingClientRect();

        if (elementRect.bottom > containerRect.bottom) {
          container.scrollTop += elementRect.bottom - containerRect.bottom;
        } else if (elementRect.top < containerRect.top) {
          container.scrollTop -= containerRect.top - elementRect.top;
        }
      }
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isVisible && e.key !== "Enter") return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = Math.min(activeIndex + 1, hits.length - 1);
      setActiveIndex(nextIndex);

      // Trigger infinite scroll if reaching end via keyboard
      if (nextIndex === hits.length - 1) {
        loadMore();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && hits[activeIndex]) {
        window.location.href = `https://www.npmjs.com/package/${hits[activeIndex].name}`;
      } else {
        window.location.href = `https://www.npmjs.com/search?q=${encodeURIComponent(query)}`;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full font-sans${isDark ? " dark" : ""}`}
    >
      <div
        className="relative w-full h-full flex items-center bg-zinc-100 dark:bg-zinc-800"
        style={
          isInputFocused ? { boxShadow: "inset 0 0 0 1px #fb923c" } : undefined
        }
      >
        {/* Search Mode Filter Toggle */}
        <button
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className={`h-full px-3 flex items-center gap-1.5 transition-colors border-r border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 group ${isFilterMenuOpen ? "bg-zinc-200 dark:bg-zinc-700" : ""}`}
          title="Search Mode"
        >
          <Filter
            size={16}
            className={
              activeFilter
                ? "text-orange-500"
                : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
            }
          />
          <ChevronDown
            size={12}
            className={`text-zinc-400 transition-transform ${isFilterMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Filter Menu Dropdown */}
        {isFilterMenuOpen && (
          <div
            ref={filterMenuRef}
            className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-md py-1 z-10000"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 mb-1">
              Search Mode
            </div>
            {searchModes.map((mode) => (
              <button
                key={mode.key}
                onClick={() => {
                  setActiveFilter(activeFilter?.key === mode.key ? null : mode);
                  setIsFilterMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                  activeFilter?.key === mode.key
                    ? "text-orange-600 dark:text-orange-400 font-bold bg-orange-50/50 dark:bg-orange-900/10"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {mode.label}
                {activeFilter?.key === mode.key && <Check size={14} />}
              </button>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          name="q"
          autoComplete="off"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsInputFocused(true);
            if (hits.length > 0) setIsVisible(true);
          }}
          onBlur={() => setIsInputFocused(false)}
          onClick={() => {
            if (hits.length > 0) setIsVisible(true);
          }}
          placeholder={
            activeFilter
              ? `Search by ${activeFilter.label.toLowerCase()}...`
              : "Search packages"
          }
          className="flex-1 h-full px-4 py-2.5 bg-transparent border-none rounded-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-normal outline-none transition-all shadow-inner"
        />

        {isFetching ? (
          <div className="px-3 flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <button
            onClick={() => {
              if (query) {
                window.location.href = `https://www.npmjs.com/search?q=${encodeURIComponent(query)}`;
              }
            }}
            className="h-full px-4 flex items-center justify-center text-zinc-400 hover:text-orange-600 transition-colors border-l border-zinc-200 dark:border-zinc-700"
            title="Search NPM"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      {activeFilter && (
        <div className="absolute top-[calc(100%+8px)] left-0 flex gap-2 z-50">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-600 text-white rounded shadow-sm text-[10px] font-bold uppercase tracking-wider">
            <span>
              {activeFilter.label}: {query}
            </span>
            <button
              onClick={() => {
                setActiveFilter(null);
                setQuery("");
              }}
              className="ml-1 hover:scale-110 transition-transform font-black"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isVisible && hits.length > 0 && (
        <div
          ref={resultsContainerRef}
          onScroll={handleScroll}
          className="absolute top-full left-0 right-0 mt-0.5 bg-white dark:bg-zinc-900 border-x border-b border-zinc-200 dark:border-zinc-800 shadow-2xl z-9999 max-h-[70vh] overflow-y-auto overflow-x-hidden"
        >
          {hits.map((hit, index) => (
            <div
              key={hit.objectID || hit.name}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur before navigation
                window.location.href = `https://www.npmjs.com/package/${hit.name}`;
              }}
              className={`flex flex-col px-4 py-3 cursor-pointer transition-colors border-l-4 ${
                index === activeIndex
                  ? "bg-zinc-100 dark:bg-zinc-800/50 border-l-orange-500"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30 border-l-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm font-bold truncate ${index === activeIndex ? "text-black dark:text-white" : "text-zinc-800 dark:text-zinc-200"}`}
                >
                  {hit.name}
                </span>
                {hit.version && (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    v{hit.version}
                  </span>
                )}
              </div>
              {hit.description && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-medium leading-tight">
                  {hit.description}
                </div>
              )}
            </div>
          ))}

          {isFetchingMore && (
            <div className="p-4 flex justify-center border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Loading more...
                </span>
              </div>
            </div>
          )}

          {!isFetchingMore && page < nbPages - 1 && (
            <div
              className="p-3 bg-zinc-50 dark:bg-zinc-800/20 text-center border-t border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
              onMouseDown={(e) => {
                e.preventDefault();
                window.location.href = `https://www.npmjs.com/search?q=${encodeURIComponent(query)}`;
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-orange-600 transition-colors">
                View all results for "{query}"
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
