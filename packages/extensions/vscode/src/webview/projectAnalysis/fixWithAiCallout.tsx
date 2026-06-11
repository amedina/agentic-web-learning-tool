/**
 * External dependencies.
 */
import { useCallback, useState, type FC } from "react";
import { ChevronDown, ChevronRight, Copy, Plug, Sparkles } from "lucide-react";

/**
 * Internal dependencies.
 */
import { buildFixPrompt } from "./helpers";
import type { PostCopyPrompt, PostSetupMcp } from "./types";

interface FixWithAiCalloutProps {
  rootPath: string;
  publintCount: number;
  circularCount: number;
  postCopyPrompt: PostCopyPrompt;
  postSetupMcp: PostSetupMcp;
}

/**
 * Collapsible callout above the results that points users at fixing
 * these findings with their AI assistant. Collapsed by default to save
 * space; expanding reveals "Copy prompt" (a ready-to-paste prompt scoped
 * to this project and the issue kinds present) and "Set up MCP" (opens
 * the MCP setup wizard so the assistant can reach the npm-advisor tools).
 * The detection stays read-only; this is the bridge to an actual fix.
 */
export const FixWithAiCallout: FC<FixWithAiCalloutProps> = ({
  rootPath,
  publintCount,
  circularCount,
  postCopyPrompt,
  postSetupMcp,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleCopy = useCallback(() => {
    postCopyPrompt(
      buildFixPrompt(rootPath, publintCount, circularCount),
      "Fix prompt copied. Paste it into Claude Code or your AI assistant.",
    );
  }, [rootPath, publintCount, circularCount, postCopyPrompt]);

  return (
    <div className="rounded border border-violet-200 dark:border-violet-900 bg-violet-50/60 dark:bg-violet-950/40 text-xs text-slate-700 dark:text-slate-200">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown size={14} className="shrink-0 text-violet-500" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-violet-500" />
        )}
        <Sparkles
          size={14}
          className="shrink-0 text-violet-500 dark:text-violet-300"
        />
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          Fix these with your AI assistant
        </span>
      </button>
      {expanded ? (
        <div className="px-3 pb-3 pl-9">
          <div className="text-slate-600 dark:text-slate-300">
            Send these findings to Claude Code (or any MCP client) via the
            npm-advisor MCP server to get grouped, root-cause fixes, not
            file-by-file edits.
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded border border-violet-300 dark:border-violet-800 bg-white dark:bg-slate-800 px-2 py-1 font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-slate-700"
            >
              <Copy size={12} />
              Copy prompt
            </button>
            <button
              type="button"
              onClick={postSetupMcp}
              className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Plug size={12} />
              Set up MCP
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
