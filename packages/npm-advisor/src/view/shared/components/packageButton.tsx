/**
 * External dependencies.
 */
import { useState, useEffect } from "react";
import { Loader2, Scale, Check } from "lucide-react";

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
    <span className="inline-flex items-center gap-1 shrink-0 align-middle">
      <span className="font-mono text-[13px] font-semibold text-blue-600 dark:text-blue-400 leading-none">
        {packageName}
      </span>
      <button
        onClick={handleAdd}
        disabled={isAdding || isAdded || isAlreadyAdded}
        title={title}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-md transition-all duration-200 outline-none ${
          isAdded || isAlreadyAdded
            ? "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50"
            : isAdding
              ? "text-slate-400 dark:text-slate-500 animate-pulse"
              : "text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-transparent hover:border-blue-100 dark:hover:border-blue-800/50 cursor-pointer"
        }`}
      >
        {isAlreadyAdded ? (
          <Check className="w-3.5 h-3.5" />
        ) : isAdded ? (
          <Check className="w-3.5 h-3.5" />
        ) : isAdding ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Scale className="w-4 h-4" />
        )}
      </button>
    </span>
  );
};
