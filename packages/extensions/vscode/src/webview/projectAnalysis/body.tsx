/**
 * External dependencies.
 */
import { type FC } from "react";
import { Loader2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import { IdleExplainer } from "./idleExplainer";
import { Results } from "./results";
import type { PostCopyPrompt, PostReveal, PostSetupMcp, Status } from "./types";

interface BodyProps {
  status: Status;
  postReveal: PostReveal;
  postCopyPrompt: PostCopyPrompt;
  postSetupMcp: PostSetupMcp;
}

/**
 * Renders the body of the tab. Shows an empty/loading/error state, or
 * the summary + grouped findings list once analysis succeeds.
 */
export const Body: FC<BodyProps> = ({
  status,
  postReveal,
  postCopyPrompt,
  postSetupMcp,
}) => {
  if (status.kind === "idle") {
    return <IdleExplainer />;
  }
  if (status.kind === "running") {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 size={14} className="animate-spin" />
        Analyzing project…
      </div>
    );
  }
  if (status.kind === "error") {
    return (
      <div className="rounded border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
        Analysis failed: {status.message}
      </div>
    );
  }
  return (
    <Results
      analysis={status.analysis}
      postReveal={postReveal}
      postCopyPrompt={postCopyPrompt}
      postSetupMcp={postSetupMcp}
    />
  );
};
