/**
 * External dependencies.
 */
import { type FC } from "react";
import { CornerDownLeft } from "lucide-react";

/**
 * Internal dependencies.
 */
import { EdgeLabel } from "./edgeLabel";
import { describeEdge, hasEdgeDetails, shortenPath } from "./helpers";
import type { CycleEdge } from "./types";

interface CycleGraphProps {
  files: string[];
  fullPaths: string[];
  edges: CycleEdge[];
  onSelect: (index: number) => void;
}

/**
 * Visualization of a single cycle as a clean vertical flow. Each file
 * is a full-width pill connected to the next by a downward arrow,
 * labelled "imports" so the direction of the dependency is explicit;
 * a final loop-back row closes the cycle by pointing at the first file
 * again. This style mirrors madge's CLI image output (a directed
 * top-to-bottom chain) and stays readable at any cycle length without
 * the overlaps a 2D circular layout suffers from in a narrow sidebar.
 */
export const CycleGraph: FC<CycleGraphProps> = ({
  files,
  fullPaths,
  edges,
  onSelect,
}) => {
  if (files.length === 0) {
    return null;
  }
  const firstLabel = shortenPath(files[0]);
  const firstFullPath = fullPaths[0] ?? files[0];
  const loopBackEdge = edges[files.length - 1];

  return (
    <div className="mt-2 rounded border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold">
          Cycle graph
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          Click a node to open
        </span>
      </div>
      <div className="relative pl-3">
        <span
          aria-hidden="true"
          className="absolute left-0 top-3 bottom-3 border-l-2 border-dashed border-amber-400 dark:border-amber-700"
        />
        <ol className="flex flex-col gap-1.5">
          {files.map((file, index) => {
            const label = shortenPath(file);
            const fullPath = fullPaths[index] ?? file;
            const isLast = index === files.length - 1;
            const edge = edges[index];
            return (
              <li key={`${file}-${index}`} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  title={fullPath}
                  className="w-full text-left rounded-md border border-amber-400 dark:border-amber-700 bg-amber-100/80 dark:bg-amber-950/80 px-3 py-1.5 text-xs font-mono text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors break-all"
                >
                  {label}
                </button>
                {!isLast && <EdgeLabel edge={edge} variant="block" />}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="mt-2 flex flex-col gap-1 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-100/60 dark:bg-amber-950/60 px-3 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
        <div className="flex items-center gap-1.5">
          <CornerDownLeft
            size={12}
            className="shrink-0 -scale-y-100"
            aria-hidden="true"
          />
          <span className="min-w-0 break-all">
            loops back to{" "}
            <button
              type="button"
              className="font-mono underline-offset-2 hover:underline"
              onClick={() => onSelect(0)}
              title={firstFullPath}
            >
              {firstLabel}
            </button>
          </span>
        </div>
        {loopBackEdge && hasEdgeDetails(loopBackEdge) && (
          <div className="pl-[18px] text-[10px] italic text-amber-700 dark:text-amber-300">
            via {describeEdge(loopBackEdge)}
          </div>
        )}
      </div>
    </div>
  );
};
