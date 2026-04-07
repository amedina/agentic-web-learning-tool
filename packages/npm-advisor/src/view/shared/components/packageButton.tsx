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

  const title = isAlreadyAdded
    ? "Already in comparison"
    : isAdded
      ? "Added!"
      : isAdding
        ? "Adding..."
        : "Add to comparison";

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0 align-middle">
      <span className="font-mono text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-all cursor-default">
        {packageName}
      </span>
      <button
        onClick={handleAdd}
        disabled={isAdding || isAdded || isAlreadyAdded}
        title={title}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 outline-none ${
          isAdded || isAlreadyAdded
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
            : isAdding
              ? "bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 animate-pulse"
              : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:scale-110 active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
        }`}
      >
        {isAlreadyAdded || isAdded ? (
          <Check className="w-3 h-3 stroke-[3px] animate-in zoom-in duration-300" />
        ) : isAdding ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3 stroke-[3px]" />
        )}
      </button>
    </span>
  );
};
