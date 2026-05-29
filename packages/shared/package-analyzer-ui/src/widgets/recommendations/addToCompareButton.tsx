/**
 * External dependencies.
 */
import React from "react";
import { Plus, Check, Loader2 } from "lucide-react";

export interface AddToCompareButtonProps {
  packageName: string;
  onAddToCompare: (packageName: string) => void;
  isAdded: boolean;
  isAdding: boolean;
  onNavigateToComparison?: () => void;
}

/**
 * Renders the per-recommendation compare control: a spinner while the package
 * is being added, a "view comparison" check once added, or an add button.
 */
export const AddToCompareButton: React.FC<AddToCompareButtonProps> = ({
  packageName,
  onAddToCompare,
  isAdded,
  isAdding,
  onNavigateToComparison,
}) => {
  if (isAdding) {
    return (
      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 shrink-0">
        <Loader2 size={12} className="animate-spin text-slate-400" />
      </span>
    );
  }

  if (isAdded) {
    return (
      <div className="group/tooltip relative ml-2 shrink-0">
        <button
          onClick={() => onNavigateToComparison?.()}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
        >
          <Check size={10} />
        </button>
        <div className="pointer-events-none hidden group-hover/tooltip:block absolute z-50 w-28 p-1.5 bg-slate-800 text-white text-xs rounded-md bottom-full left-1/2 -translate-x-1/2 mb-2 shadow-lg text-center whitespace-normal">
          View comparison
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="group/tooltip relative ml-2 shrink-0">
      <button
        onClick={() => onAddToCompare(packageName)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
      >
        <Plus size={10} />
      </button>
      <div className="pointer-events-none hidden group-hover/tooltip:block absolute z-50 w-24 p-1.5 bg-slate-800 text-white text-xs rounded-md bottom-full left-1/2 -translate-x-1/2 mb-2 shadow-lg text-center whitespace-normal">
        Add to compare
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};
