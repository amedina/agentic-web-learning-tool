/**
 * External dependencies.
 */
import { useCallback, useState, type FC } from "react";
import { ExternalLink, Network, Repeat } from "lucide-react";
import type { ProjectFinding } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { ArrowWithSymbols } from "./arrowWithSymbols";
import { CycleGraph } from "./cycleGraph";
import { FilePill } from "./filePill";
import type { CycleEdge, PostReveal } from "./types";

interface CircularDependencyRowProps {
  finding: ProjectFinding;
  postReveal: PostReveal;
}

/**
 * Renders one cycle as a list of pill-shaped truncated file names with
 * a per-pill tooltip showing the full path. An expandable section
 * reveals an SVG graph of the cycle, with the files arranged on a
 * circle and arrows showing the dependency direction.
 */
export const CircularDependencyRow: FC<CircularDependencyRowProps> = ({
  finding,
  postReveal,
}) => {
  const cycleRelative =
    (finding.data?.cycleRelative as string[] | undefined) ?? [];
  const cycleAbsolute = (finding.data?.cycle as string[] | undefined) ?? [];
  const edges = (finding.data?.edges as CycleEdge[] | undefined) ?? [];
  const cycleLength =
    typeof finding.data?.cycleLength === "number"
      ? (finding.data.cycleLength as number)
      : cycleRelative.length;

  const [showGraph, setShowGraph] = useState(false);

  const handleOpenFirst = useCallback(() => {
    if (!finding.file) {
      return;
    }
    postReveal(finding.file);
  }, [finding, postReveal]);

  return (
    <li className="px-3 py-2 flex items-start gap-2 text-sm">
      <Repeat
        size={14}
        className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="text-slate-700 dark:text-slate-200 text-xs font-medium">
          Cycle of {cycleLength} {cycleLength === 1 ? "file" : "files"}
        </div>
        {cycleRelative.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1 min-w-0">
            {cycleRelative.map((entry, index) => {
              const absolute = cycleAbsolute[index];
              const edge = edges[index];
              return (
                <div
                  key={`${entry}-${index}`}
                  className="inline-flex items-center gap-1 max-w-full min-w-0"
                >
                  <FilePill
                    label={entry}
                    fullPath={absolute ?? entry}
                    onClick={() => {
                      if (absolute) {
                        postReveal(absolute);
                      }
                    }}
                  />
                  <ArrowWithSymbols edge={edge} />
                </div>
              );
            })}
            <FilePill
              label={cycleRelative[0]}
              fullPath={cycleAbsolute[0] ?? cycleRelative[0]}
              dimmed
              onClick={() => {
                const firstAbsolute = cycleAbsolute[0];
                if (firstAbsolute) {
                  postReveal(firstAbsolute);
                }
              }}
            />
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
            onClick={() => setShowGraph((value) => !value)}
            aria-pressed={showGraph}
          >
            <Network size={10} />
            {showGraph ? "Hide graph" : "Show graph"}
          </button>
          {finding.file && (
            <button
              type="button"
              className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
              onClick={handleOpenFirst}
            >
              Open first file
            </button>
          )}
          <a
            href="https://github.com/pahen/madge#readme"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
          >
            Docs
            <ExternalLink size={10} />
          </a>
        </div>
        {showGraph && (
          <CycleGraph
            files={cycleRelative}
            fullPaths={cycleAbsolute}
            edges={edges}
            onSelect={(index) => {
              const absolute = cycleAbsolute[index];
              if (absolute) {
                postReveal(absolute);
              }
            }}
          />
        )}
      </div>
    </li>
  );
};
