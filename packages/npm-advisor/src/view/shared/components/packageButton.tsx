/**
 * External dependencies.
 */
import { useState, useEffect } from "react";
import { Loader2, Plus, Check } from "lucide-react";

export const PackageButton = ({ packageName }: { packageName: string }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAlreadyAdded, setIsAlreadyAdded] = useState(false);

  useEffect(() => {
    const checkBucket = (changes?: any) => {
      if (changes && !changes.comparisonBucket) return;

      chrome.storage.local.get(["comparisonBucket"], (res) => {
        const bucket = res.comparisonBucket || [];

        if (!Array.isArray(bucket)) return;

        const exists = bucket.some(
          (p) => p.packageName === packageName || p.name === packageName,
        );

        setIsAlreadyAdded(exists);
      });
    };

    checkBucket();

    chrome.storage.onChanged.addListener(checkBucket);
    return () => {
      chrome.storage.onChanged.removeListener(checkBucket);
    };
  }, [packageName]);

  const handleAdd = async () => {
    if (isAdding || isAdded || isAlreadyAdded) return;

    setIsAdding(true);

    try {
      const res = await chrome.storage.local.get(["comparisonBucket"]);

      let currentBucket = (res.comparisonBucket as any[]) || [];

      if (!Array.isArray(currentBucket)) {
        currentBucket = [];
      }

      if (
        !currentBucket.some(
          (p) => p.packageName === packageName || p.name === packageName,
        )
      ) {
        const response = await chrome.runtime.sendMessage({
          type: "GET_STATS",
          packageName: packageName,
        });

        if (response && response.success) {
          currentBucket = [...currentBucket, response.data];
          await chrome.storage.local.set({ comparisonBucket: currentBucket });
        }
      }

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error("Failed to add package:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-2.5 pr-1 py-1 rounded-full mx-1 align-middle shadow-sm transition-colors mb-1">
      <span className="font-mono font-medium text-slate-700 dark:text-slate-300 text-[11px] leading-none">
        {packageName}
      </span>
      <button
        onClick={handleAdd}
        disabled={isAdding || isAdded || isAlreadyAdded}
        className={`flex items-center justify-center text-[10px] uppercase font-bold tracking-wide outline-none px-2 py-1 rounded-full transition-all duration-200 ease-in-out ${
          isAdded || isAlreadyAdded
            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
            : isAdding
              ? "bg-blue-50 dark:bg-blue-950 text-blue-400 dark:text-blue-500 border border-blue-100 dark:border-blue-900 cursor-not-allowed"
              : "bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer"
        }`}
      >
        {isAlreadyAdded ? (
          <>
            <Check className="w-3 h-3 mr-1" /> In comparison
          </>
        ) : isAdded ? (
          <>
            <Check className="w-3 h-3 mr-1" /> Added
          </>
        ) : isAdding ? (
          <>
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Wait
          </>
        ) : (
          <>
            <Plus className="w-3 h-3 mr-1" /> Compare
          </>
        )}
      </button>
    </span>
  );
};
