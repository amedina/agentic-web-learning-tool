/**
 * External dependencies.
 */
import { useRef, useState } from "react";
import { SearchBox, useInfiniteHits, useSearchBox } from "react-instantsearch";
import { X, Loader2, Check, Search } from "lucide-react";

/**
 * Internal dependencies.
 */
import { ResultsList } from "./resultsList";

export const SearchWrapper = () => {
  const { query, refine } = useSearchBox();
  const { items } = useInfiniteHits();
  const [selectedPackages, setSelectedPackages] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const togglePackage = (hit: any) => {
    setSelectedPackages((prev) => {
      const exists = prev.find((p) => p.name === hit.name);
      if (exists) {
        return prev.filter((p) => p.name !== hit.name);
      }

      return [...prev, { name: hit.name, description: hit.description }];
    });
  };

  const removeSelected = (name: string) => {
    setSelectedPackages((prev) => prev.filter((p) => p.name !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!query) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();

      setActiveIndex((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();

      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();

        togglePackage(items[activeIndex]);
      }
    } else if (e.key === "Escape") {
      refine("");
      setActiveIndex(-1);
    }
  };

  const handleBatchCompare = async () => {
    if (selectedPackages.length === 0 || isAnalyzing) return;

    setIsAnalyzing(true);
    setProgress({ current: 0, total: selectedPackages.length });
    refine("");
    setActiveIndex(-1);

    try {
      const res = await new Promise<any>((resolve) => {
        chrome.storage.local.get(["comparisonBucket"], resolve);
      });
      let currentBucket = res.comparisonBucket || [];

      for (let i = 0; i < selectedPackages.length; i++) {
        const pkg = selectedPackages[i];
        setProgress({ current: i + 1, total: selectedPackages.length });

        // Skip if already in bucket
        if (currentBucket.some((p: any) => p.packageName === pkg.name)) {
          continue;
        }

        const response = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage(
            { type: "GET_STATS", packageName: pkg.name },
            resolve,
          );
        });

        if (response && response.success) {
          currentBucket = [...currentBucket, response.data];
          await new Promise<void>((resolve) => {
            chrome.storage.local.set(
              { comparisonBucket: currentBucket },
              resolve,
            );
          });
        }
      }

      setSelectedPackages([]);
    } catch (err) {
      console.error("[NPM Advisor] Batch compare failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div ref={searchContainerRef} className="max-w-[600px] mb-8">
      <div className="relative group/search" onKeyDown={handleKeyDown}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amethyst-haze pointer-events-none z-10" />
        <SearchBox
          placeholder="Search npm packages to compare..."
          className="mb-0"
          classNames={{
            input:
              "w-full pl-11 py-3 bg-white-subtle dark:bg-bg-background border border-subtle-zinc dark:border-darth-vader text-text-primary placeholder:text-amethyst-haze rounded-sm focus:ring-2 focus:ring-baby-blue focus:border-transparent outline-none transition-all pr-36 group-hover/search:border-baby-blue/50 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
            submit: "hidden",
            reset:
              "absolute right-3 top-1/2 -translate-y-1/2 p-2 text-amethyst-haze hover:text-baby-blue [&>svg]:w-5 [&>svg]:h-5 appearance-none",
          }}
        />
        {query.trim() && selectedPackages.length >= 2 && !isAnalyzing && (
          <button
            onClick={handleBatchCompare}
            className="absolute right-12 top-1/2 -translate-y-1/2 bg-baby-blue text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-baby-blue/90 transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] flex items-center animate-in fade-in zoom-in duration-300"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Compare
          </button>
        )}
        {query.trim() && (
          <ResultsList
            onToggle={togglePackage}
            selectedPackages={selectedPackages}
            activeIndex={activeIndex}
          />
        )}
      </div>

      {/* Selected Packages Tags */}
      {selectedPackages.length > 0 && (
        <div className="mt-5 pt-5 border-t border-subtle-zinc dark:border-darth-vader">
          <div className="flex flex-wrap gap-2.5 mb-5">
            {selectedPackages.map((pkg) => (
              <div
                key={pkg.name}
                className="flex items-center bg-baby-blue/10 text-baby-blue px-4 py-1.5 rounded-full text-sm font-semibold border border-baby-blue/20 animate-in slide-in-from-left-2 duration-300 shadow-sm"
              >
                <span className="max-w-50 truncate">{pkg.name}</span>
                <button
                  onClick={() => removeSelected(pkg.name)}
                  className="ml-2.5 hover:text-baby-blue/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleBatchCompare}
            disabled={isAnalyzing}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide uppercase flex items-center justify-center transition-all ${
              isAnalyzing
                ? "bg-aswad text-amethyst-haze cursor-not-allowed opacity-70"
                : "bg-baby-blue text-white hover:bg-baby-blue/90 shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_28px_rgba(59,130,246,0.4)] active:scale-[0.98]"
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2.5 animate-spin" />
                Analyzing {progress.current}/{progress.total}...
              </>
            ) : (
              <>Compare {selectedPackages.length} Packages</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
