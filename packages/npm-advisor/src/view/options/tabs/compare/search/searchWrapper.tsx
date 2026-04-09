/**
 * External dependencies.
 */
import { useEffect, useRef, useState } from "react";
import { SearchBox, useSearchBox } from "react-instantsearch";
import { X, Loader2, Check } from "lucide-react";

/**
 * Internal dependencies.
 */
import { ResultsList } from "./resultsList";

export const SearchWrapper = () => {
  const { query, refine } = useSearchBox();
  const [selectedPackages, setSelectedPackages] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        refine("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [refine]);

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

  const handleBatchCompare = async () => {
    if (selectedPackages.length === 0 || isAnalyzing) return;

    setIsAnalyzing(true);
    setProgress({ current: 0, total: selectedPackages.length });
    refine(""); // Clear search to hide overlay immediately

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
    <div ref={searchContainerRef} className="space-y-6">
      <div className="p-6 bg-bg-surface dark:bg-aswad rounded-2xl border border-subtle-zinc dark:border-darth-vader shadow-xl relative transition-all duration-300">
        <h4 className="text-xs font-bold text-exclusive-plum mb-4 uppercase tracking-[0.2em]">
          Search Packages
        </h4>
        <div className="relative group/search">
          <SearchBox
            placeholder="Search npm packages to compare..."
            className="mb-0"
            classNames={{
              input:
                "w-full px-5 py-3 bg-bg-surface-subtle dark:bg-bg-background border border-subtle-zinc dark:border-darth-vader text-text-primary placeholder:text-amethyst-haze rounded-xl focus:ring-2 focus:ring-baby-blue focus:border-transparent outline-none transition-all pr-36 group-hover/search:border-baby-blue/50 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
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
    </div>
  );
};
