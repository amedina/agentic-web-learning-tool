/**
 * External dependencies.
 */
import { useCallback, type FC } from "react";
import { Copy, Plug, Sparkles } from "lucide-react";

/**
 * Internal dependencies.
 */
import { buildAggregateFixPrompt } from "./helpers";
import type { PostCopyPrompt, PostSetupMcp } from "../projectAnalysis/types";
import type {
  ProjectHealthReport,
  SuppressionEntry,
} from "../../projectHealth/types";

interface AggregateFixCalloutProps {
  report: ProjectHealthReport;
  suppressions: SuppressionEntry[];
  postCopyPrompt: PostCopyPrompt;
  postSetupMcp: PostSetupMcp;
}

/**
 * A single workspace-wide "fix with AI" box shown at the top of Project
 * Health. "Copy prompt" assembles every actionable finding across all
 * packages (excluding suppressed ones) into one prompt; "Set up MCP"
 * opens the wizard so the assistant can reach the npm-advisor tools.
 * This replaces the per-package callout the embedded analysis would
 * otherwise show.
 */
export const AggregateFixCallout: FC<AggregateFixCalloutProps> = ({
  report,
  suppressions,
  postCopyPrompt,
  postSetupMcp,
}) => {
  const handleCopy = useCallback(() => {
    postCopyPrompt(
      buildAggregateFixPrompt(report, suppressions),
      "Project Health fix prompt copied. Paste it into Claude Code or your AI assistant.",
    );
  }, [report, suppressions, postCopyPrompt]);

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
            Copies one prompt covering every package&apos;s vulnerabilities,
            license issues, and publishing problems, so your assistant can fix
            the whole workspace in a single pass.
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded border border-violet-300 dark:border-violet-800 bg-white dark:bg-slate-800 px-2 py-1 font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-slate-700"
            >
              <Copy size={12} />
              Copy prompt for all issues
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
