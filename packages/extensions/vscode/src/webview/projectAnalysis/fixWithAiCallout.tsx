/**
 * External dependencies.
 */
import { useCallback, type FC } from "react";
import { Copy, Plug, Sparkles } from "lucide-react";

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
 * Callout above the results that points users at fixing these findings
 * with their AI assistant. "Copy prompt" drops a ready-to-paste prompt
 * (scoped to this project and the issue kinds present) on the clipboard;
 * "Set up MCP" opens the MCP setup wizard so the assistant can reach the
 * npm-advisor tools and prompts. The detection stays read-only — this is
 * the bridge to an actual fix.
 */
export const FixWithAiCallout: FC<FixWithAiCalloutProps> = ({
  rootPath,
  publintCount,
  circularCount,
  postCopyPrompt,
  postSetupMcp,
}) => {
  const handleCopy = useCallback(() => {
    postCopyPrompt(
      buildFixPrompt(rootPath, publintCount, circularCount),
      "Fix prompt copied — paste it into Claude Code or your AI assistant.",
    );
  }, [rootPath, publintCount, circularCount, postCopyPrompt]);

  return (
    <div className="rounded border border-violet-200 dark:border-violet-900 bg-violet-50/60 dark:bg-violet-950/40 p-3 text-xs text-slate-700 dark:text-slate-200">
      <div className="flex items-start gap-2">
        <Sparkles
          size={14}
          className="shrink-0 mt-0.5 text-violet-500 dark:text-violet-300"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 dark:text-slate-100">
            Fix these with your AI assistant
          </div>
          <div className="mt-0.5 text-slate-600 dark:text-slate-300">
            Send these findings to Claude Code (or any MCP client) via the
            npm-advisor MCP server to get grouped, root-cause fixes — not
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
      </div>
    </div>
  );
};
