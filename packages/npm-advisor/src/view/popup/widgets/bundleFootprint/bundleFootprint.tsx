/**
 * External dependencies.
 */
import React from "react";
import { Zap, HardDrive, Leaf, Info, Box } from "lucide-react";

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export interface BundleFootprintProps {
  bundle: {
    size: number;
    gzip: number;
    isTreeShakeable: boolean;
    hasSideEffects: boolean | string[];
  } | null;
}

export const BundleFootprint: React.FC<BundleFootprintProps> = ({ bundle }) => {
  if (!bundle) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200 mb-3">
        <Zap size={16} className="mr-2 text-slate-600 dark:text-slate-400" />{" "}
        Bundle footprint
      </h2>
      <div className="flex gap-4">
        <div className="flex-1 bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border border-slate-100 dark:border-slate-600 flex flex-col items-center justify-center">
          <HardDrive
            size={20}
            className="text-slate-400 dark:text-slate-500 mb-1"
          />
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            Minified
          </span>
          <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {formatBytes(bundle.size)}
          </span>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border border-slate-100 dark:border-slate-600 flex flex-col items-center justify-center">
          <Zap size={20} className="text-amber-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            GZipped
          </span>
          <span className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {formatBytes(bundle.gzip)}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-col space-y-2 text-sm max-w-full">
        <div className="flex items-center justify-between overflow-visible">
          <span className="flex items-center text-slate-600 dark:text-slate-400">
            <Leaf size={14} className="mr-2 text-emerald-500" /> Tree-shakeable
            <div className="group relative flex items-center ml-1.5 cursor-help">
              <Info size={14} className="text-slate-400 dark:text-slate-500" />
              <div className="hidden group-hover:block absolute z-50 w-48 p-2 bg-slate-800 text-white text-xs rounded-md bottom-full left-1/2 -translate-x-1/2 mb-2 shadow-lg text-center font-normal normal-case tracking-normal whitespace-normal">
                Indicates if dead code can be removed by bundlers like Webpack
                or Rollup.
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </span>
          <span className="font-medium dark:text-slate-300">
            {bundle.isTreeShakeable ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center justify-between overflow-visible">
          <span className="flex items-center text-slate-600 dark:text-slate-400">
            <Box size={14} className="mr-2 text-blue-500" /> Side Effects
            <div className="group relative flex items-center ml-1.5 cursor-help">
              <Info size={14} className="text-slate-400 dark:text-slate-500" />
              <div className="hidden group-hover:block absolute z-50 w-48 p-2 bg-slate-800 text-white text-xs rounded-md bottom-full left-1/2 -translate-x-1/2 mb-2 shadow-lg text-center font-normal normal-case tracking-normal whitespace-normal">
                False means the package has no side effects and is heavily
                tree-shakeable.
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </span>
          <span
            className="font-medium dark:text-slate-300 text-right max-w-[150px] truncate"
            title={String(bundle.hasSideEffects)}
          >
            {Array.isArray(bundle.hasSideEffects)
              ? `${bundle.hasSideEffects.length} files`
              : bundle.hasSideEffects
                ? "Yes"
                : "No"}
          </span>
        </div>
      </div>
    </div>
  );
};
