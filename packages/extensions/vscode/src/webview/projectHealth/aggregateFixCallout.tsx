/**
 * External dependencies.
 */
import { useCallback, useState, type FC } from "react";
import { ChevronDown, ChevronRight, Copy, Plug, Sparkles } from "lucide-react";

/**
 * Internal dependencies.
 */
import { buildAggregateFixPrompt } from "./helpers";
import type { PostCopyPrompt, PostSetupMcp } from "../projectAnalysis/types";
import type {
  ProjectHealthReport,
  ProjectHealthScope,
  SuppressionEntry,
} from "../../projectHealth/types";

interface AggregateFixCalloutProps {
  /** Which sub-tab's findings the prompt covers. */
  scope: ProjectHealthScope;
  report: ProjectHealthReport;
  suppressions: SuppressionEntry[];
  postCopyPrompt: PostCopyPrompt;
  postSetupMcp: PostSetupMcp;
}

/** Scope-specific copy for the callout body, button, and toast. */
const SCOPE_COPY: Record<
  ProjectHealthScope,
  { description: string; button: string; toast: string }
> = {
  dependencies: {
    description:
      "Copies one prompt covering every package's vulnerabilities and license issues, so your assistant can fix them in a single pass.",
    button: "Copy dependency fix prompt",
    toast:
      "Dependency fix prompt copied. Paste it into Claude Code or your AI assistant.",
  },
  project: {
    description:
      "Copies one prompt covering every package's publishing, circular-dependency, and replacement issues, so your assistant can fix them in a single pass.",
    button: "Copy project-analysis fix prompt",
    toast:
      "Project-analysis fix prompt copied. Paste it into Claude Code or your AI assistant.",
  },
  all: {
    description:
      "Copies one prompt covering every package's issues, so your assistant can fix the whole workspace in a single pass.",
    button: "Copy fix prompt",
    toast:
      "Project Health fix prompt copied. Paste it into Claude Code or your AI assistant.",
  },
};

/**
 * A collapsible "fix with AI" callout for one sub-tab. Collapsed by
 * default to save space; expanding reveals a short explanation plus
 * "Copy prompt" (which assembles that sub-tab's non-suppressed findings
 * into one prompt) and "Set up MCP".
 */
export const AggregateFixCallout: FC<AggregateFixCalloutProps> = ({
  scope,
  report,
  suppressions,
  postCopyPrompt,
  postSetupMcp,
}) => {
  const [expanded, setExpanded] = useState(false);
  const copy = SCOPE_COPY[scope];

  const handleCopy = useCallback(() => {
    postCopyPrompt(
      buildAggregateFixPrompt(report, suppressions, scope),
      copy.toast,
    );
  }, [report, suppressions, scope, copy.toast, postCopyPrompt]);

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
            {copy.description}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded border border-violet-300 dark:border-violet-800 bg-white dark:bg-slate-800 px-2 py-1 font-medium text-violet-700 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-slate-700"
            >
              <Copy size={12} />
              {copy.button}
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
