import React from "react";
import { Zap, HardDrive, Leaf, Info } from "lucide-react";

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

interface BundleFootprintProps {
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
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-3">
        <Zap size={16} className="mr-2 text-slate-600" /> Bundle footprint
      </h2>
      <div className="flex gap-4">
        <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col items-center justify-center">
          <HardDrive size={20} className="text-slate-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Minified
          </span>
          <span className="text-lg font-semibold text-slate-800">
            {formatBytes(bundle.size)}
          </span>
        </div>
        <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col items-center justify-center">
          <Zap size={20} className="text-amber-400 mb-1" />
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            GZipped
          </span>
          <span className="text-lg font-semibold text-slate-800">
            {formatBytes(bundle.gzip)}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-col space-y-2 text-sm max-w-full">
        <div className="flex items-center justify-between">
          <span className="flex items-center text-slate-600">
            <Leaf size={14} className="mr-2 text-emerald-500" /> Tree-shakeable
          </span>
          <span className="font-medium">
            {bundle.isTreeShakeable ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center text-slate-600">
            <Info size={14} className="mr-2 text-blue-500" /> Side Effects
          </span>
          <span
            className="font-medium text-right max-w-[150px] truncate"
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
