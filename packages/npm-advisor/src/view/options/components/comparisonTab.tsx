/**
 * External dependencies.
 */
import React, { useEffect, useRef, useState } from "react";
import { BarChart2, Trash2, Award } from "lucide-react";
import { algoliasearch } from "algoliasearch";
import {
  InstantSearch,
  SearchBox,
  useHits,
  useSearchBox,
} from "react-instantsearch";
import { X, Loader2, Check } from "lucide-react";

/**
 * Internal dependencies.
 */
import { NPM_SEARCH_CONFIG } from "../../../constants";
import { calculateScore } from "../../../utils/calculateScore";

const searchClient = algoliasearch(
  NPM_SEARCH_CONFIG.appId,
  NPM_SEARCH_CONFIG.apiKey,
);

interface HitProps {
  hit: any;
  isSelected: boolean;
  onToggle: (hit: any) => void;
}

const Hit = ({ hit, isSelected, onToggle }: HitProps) => {
  return (
    <div
      onClick={() => onToggle(hit)}
      className={`p-3 border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center ${
        isSelected ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 truncate">{hit.name}</div>
        <div className="text-xs text-slate-500 leading-relaxed truncate">
          {hit.description}
        </div>
      </div>
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-blue-600 border-blue-600 shadow-sm"
            : "border-slate-300 bg-white"
        }`}
      >
        {isSelected && (
          <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
        )}
      </div>
    </div>
  );
};

const ResultsList = ({
  onToggle,
  selectedPackages,
}: {
  onToggle: (hit: any) => void;
  selectedPackages: any[];
}) => {
  const { hits } = useHits();

  return (
    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
      {hits.map((hit) => (
        <Hit
          key={hit.objectID}
          hit={hit}
          isSelected={selectedPackages.some((p) => p.name === hit.name)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};

const SearchWrapper = () => {
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
    <div ref={searchContainerRef} className="space-y-4">
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">
          Search Packages
        </h4>
        <div className="relative">
          <SearchBox
            placeholder="Search npm packages to compare..."
            className="mb-0"
            classNames={{
              input:
                "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-32 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
              submit: "hidden",
              reset:
                "absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 [&>svg]:w-4 [&>svg]:h-4 appearance-none ais-SearchBox-reset",
            }}
          />
          {selectedPackages.length >= 2 && !isAnalyzing && (
            <button
              onClick={handleBatchCompare}
              className="absolute right-15 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center animate-in fade-in zoom-in duration-300"
            >
              <Check className="w-3 h-3 mr-1" />
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
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedPackages.map((pkg) => (
                <div
                  key={pkg.name}
                  className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100 animate-in fade-in zoom-in duration-200"
                >
                  <span className="max-w-40 truncate">{pkg.name}</span>
                  <button
                    onClick={() => removeSelected(pkg.name)}
                    className="ml-2 hover:text-blue-900 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleBatchCompare}
              disabled={isAnalyzing}
              className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center transition-all ${
                isAnalyzing
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg active:transform active:scale-[0.98]"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

interface ComparisonTabProps {
  comparisonBucket: any[];
  handleClearComparison: () => void;
  winnerName: string | null;
}

/**
 * Comparison Tab.
 */
export const ComparisonTab: React.FC<ComparisonTabProps> = ({
  comparisonBucket,
  handleClearComparison,
  winnerName,
}) => {
  return (
    <div className="mt-8">
      <InstantSearch
        searchClient={searchClient}
        indexName={NPM_SEARCH_CONFIG.indexName}
      >
        <SearchWrapper />
      </InstantSearch>

      <div className="flex items-center justify-between my-4">
        <h3 className="text-lg font-semibold text-accent-foreground">
          Package Comparison
        </h3>
        {comparisonBucket.length > 0 && (
          <button
            onClick={handleClearComparison}
            className="flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors font-medium border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 px-3 py-1.5 rounded-md"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Bucket
          </button>
        )}
      </div>

      {comparisonBucket.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <BarChart2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Your comparison bucket is empty.
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            Visit an NPM package and click &quot;+ Compare&quot; in the popup
            menu.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800 text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700">
                  Metric
                </th>
                {comparisonBucket.map((pkg, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 min-w-[200px] relative"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{pkg.packageName}</span>
                      {winnerName === pkg.packageName && (
                        <span className="flex items-center bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full absolute top-2 right-2">
                          <Award className="w-3 h-3 mr-1" />
                          Winner
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Advisor Score
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 font-bold text-[#c94137] border-r border-slate-200 dark:border-slate-700 text-lg"
                  >
                    {calculateScore(pkg)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  GitHub Stars
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.stars?.toLocaleString() || "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Collaborators
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.collaboratorsCount !== null
                      ? pkg.collaboratorsCount
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Last Commit
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.lastCommitDate
                      ? new Date(pkg.lastCommitDate).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Minified Size
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.bundle?.size
                      ? `${(pkg.bundle.size / 1024).toFixed(1)} kB`
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  GZipped Size
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.bundle?.gzip ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {`${(pkg.bundle.gzip / 1024).toFixed(1)} kB`}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Tree Shakeable
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.bundle?.isTreeShakeable ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Yes
                      </span>
                    ) : pkg.bundle?.isTreeShakeable === false ? (
                      <span className="text-red-500 dark:text-red-400">No</span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Side Effects
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.bundle?.hasSideEffects === false ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        No
                      </span>
                    ) : pkg.bundle?.hasSideEffects === true ||
                      Array.isArray(pkg.bundle?.hasSideEffects) ? (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Total Dependencies
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {Object.keys(pkg.dependencyTree?.dependencies || {}).length}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Responsiveness
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.responsiveness?.description ? (
                      <div className="flex items-center mb-1">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            pkg.responsiveness.description === "Needs Attention"
                              ? "bg-red-500"
                              : pkg.responsiveness.description ===
                                  "Moderately Responsive"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                        />
                        {pkg.responsiveness.description}
                      </div>
                    ) : (
                      <div className="mb-1 text-slate-400 dark:text-slate-500">
                        Unknown
                      </div>
                    )}
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      Open Issues: {pkg.responsiveness?.openIssuesCount || 0}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Security Advisories
                </td>
                {comparisonBucket.map((pkg, idx) => {
                  const adv = pkg.securityAdvisories;
                  return (
                    <td
                      key={idx}
                      className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                    >
                      {!adv ? (
                        "Unknown"
                      ) : adv.critical === 0 &&
                        adv.high === 0 &&
                        adv.moderate === 0 &&
                        adv.low === 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          None
                        </span>
                      ) : (
                        <div className="flex flex-col space-y-1 text-xs">
                          {adv.critical > 0 && (
                            <span className="text-red-600 dark:text-red-400 font-bold">
                              {adv.critical} Critical
                            </span>
                          )}
                          {adv.high > 0 && (
                            <span className="text-red-500 dark:text-red-400 font-semibold">
                              {adv.high} High
                            </span>
                          )}
                          {adv.moderate > 0 && (
                            <span className="text-yellow-600 dark:text-yellow-400">
                              {adv.moderate} Moderate
                            </span>
                          )}
                          {adv.low > 0 && (
                            <span className="text-slate-500 dark:text-slate-400">
                              {adv.low} Low
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  License Match
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.licenseCompatibility?.isCompatible ? (
                      <span className="text-green-600 dark:text-green-400 font-medium tracking-wide">
                        Yes
                      </span>
                    ) : (
                      <span className="text-red-500 dark:text-red-400">
                        No ({pkg.license || "Default"})
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {comparisonBucket.length > 0 && winnerName && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <h4 className="flex items-center text-green-800 dark:text-green-300 font-semibold mb-1">
            <Award className="w-5 h-5 mr-2" />
            Winner: {winnerName}
          </h4>
          <p className="text-sm text-green-700 dark:text-green-400">
            Based on bundle sizes, dependency counts, and modern native
            alternatives metrics,{" "}
            <span className="font-bold">{winnerName}</span> emerged as the most
            efficient choice in this comparison bucket.
          </p>
        </div>
      )}
    </div>
  );
};
