/**
 * External dependencies
 */
import React, { useState, useEffect } from "react";
import { User, Clock, Download, Plus, Check, Loader2 } from "lucide-react";

/**
 * Internal dependencies
 */
import { calculateScore } from "@google-awlt/package-analyzer-core";
import type { AlgoliaHit } from "../../types";

interface ResultCardProps {
  hit: AlgoliaHit;
  query?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ hit, query }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [advisorScore, setAdvisorScore] = useState<number | null>(null);

  useEffect(() => {
    const checkStatus = () => {
      chrome.storage.local.get(["comparisonBucket"], (res) => {
        const bucket = (res.comparisonBucket || []) as Record<
          string,
          unknown
        >[];
        const exists = bucket.find(
          (pkg) => pkg.packageName === hit.name || pkg.name === hit.name,
        );

        if (exists) {
          setIsAdded(true);
          setAdvisorScore(calculateScore(exists));
        } else {
          setIsAdded(false);
          setAdvisorScore(null);
        }
      });
    };

    checkStatus();
    // Listen for storage changes to keep state in sync across components
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      if (changes.comparisonBucket) {
        checkStatus();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [hit.name]);

  const handleAddToComparison = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdded || isAdding) return;

    setIsAdding(true);
    chrome.runtime.sendMessage(
      {
        type: "ADD_TO_COMPARISON",
        package: hit,
      },
      (response) => {
        setIsAdding(false);
        if (response?.success) {
          setIsAdded(true);
        }
      },
    );
  };

  return (
    <div
      className="p-6 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-all cursor-pointer group relative"
      onClick={() =>
        (window.location.href = `https://www.npmjs.com/package/${hit.name}`)
      }
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex flex-col gap-1 max-w-[70%]">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors">
              {hit.name}
            </h3>
            <span className="text-[11px] font-black px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded uppercase tracking-wider">
              v{hit.version}
            </span>
            {query && hit.name.toLowerCase() === query.toLowerCase() && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 rounded uppercase tracking-wider ml-1 ring-1 ring-orange-200 dark:ring-orange-500/30">
                Exact Match
              </span>
            )}
          </div>

          <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed line-clamp-2 mt-1.5 font-medium">
            {hit.description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddToComparison}
              disabled={isAdding || isAdded}
              className={`p-1.5 rounded transition-all transform active:scale-95 border shadow-sm ${
                isAdded
                  ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30 cursor-default"
                  : isAdding
                    ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-wait"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-500 border-zinc-200 dark:border-zinc-700"
              }`}
              title={isAdded ? "Added to Comparison" : "Add to Comparison"}
            >
              {isAdding ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isAdded ? (
                <Check size={18} />
              ) : (
                <Plus size={18} />
              )}
            </button>
            {advisorScore !== null && (
              <div
                className={`text-2xl font-black ${advisorScore > 70 ? "text-green-500" : advisorScore > 40 ? "text-orange-500" : "text-red-500"}`}
              >
                {advisorScore}
              </div>
            )}
          </div>
          {advisorScore !== null && (
            <div className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">
              Advisor Score
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-zinc-500 font-medium items-center mt-4">
        {hit.owner && (
          <div className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            {hit.owner.avatar ? (
              <img
                src={hit.owner.avatar}
                alt={hit.owner.name}
                className="w-5 h-5 rounded-full ring-1 ring-zinc-200 dark:ring-zinc-700 shadow-sm"
              />
            ) : (
              <User size={16} className="text-zinc-400" />
            )}
            <span className="font-bold text-zinc-800 dark:text-zinc-100">
              {hit.owner.name}
            </span>
          </div>
        )}

        {hit.modified && (
          <div className="flex items-center gap-1.5" title="Last Published">
            <Clock size={15} className="text-zinc-400" />
            <span className="text-zinc-600 dark:text-zinc-400 font-semibold">
              {new Date(hit.modified).toLocaleDateString()}
            </span>
          </div>
        )}

        {hit.downloadsLast30Days !== undefined && (
          <div
            className="flex items-center gap-1.5"
            title="Downloads (Last 30 Days)"
          >
            <Download size={15} className="text-zinc-400" />
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {hit.downloadsLast30Days.toLocaleString()}
            </span>
            <span className="text-[11px] text-zinc-400 font-black uppercase tracking-tighter">
              / month
            </span>
          </div>
        )}

        {hit.dependents !== undefined && hit.dependents > 0 && (
          <div
            className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-6"
            title="Dependents Count"
          >
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {hit.dependents.toLocaleString()}
            </span>
            <span className="text-[11px] text-zinc-400 font-black uppercase tracking-tighter">
              dependents
            </span>
          </div>
        )}

        {hit.license && (
          <div className="flex items-center gap-1.5 uppercase font-black text-[10px] tracking-widest bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded text-zinc-500 ml-auto">
            {hit.license}
          </div>
        )}
      </div>

      {hit.keywords && hit.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {[...new Set(hit.keywords)].slice(0, 6).map((kw) => (
            <span
              key={kw}
              className="text-[10px] px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border border-zinc-100 dark:border-zinc-800 rounded-sm hover:border-orange-200 transition-colors"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
