/**
 * External dependencies.
 */
import React from "react";
import { Users, Info, AlertCircle } from "lucide-react";

export interface ResponsivenessProps {
  responsiveness: {
    description: string;
    closedIssuesRatio: number | null;
    openIssuesCount: number;
    issuesUrl: string;
  } | null;
  /**
   * True when a GitHub Core API rate-limit prevented signals from loading
   * (PAT-actionable). Reused here as a fallback indicator when the more
   * specific `githubIssuesUnavailable` flag isn't set.
   */
  githubRateLimited?: boolean;
  /**
   * True when the GitHub Search API call for issue activity was throttled.
   * The Search quota (30 req/min) trips routinely during a Report-tab
   * scan and isn't user-actionable, so we surface a softer hint here.
   */
  githubIssuesUnavailable?: boolean;
}

export const Responsiveness: React.FC<ResponsivenessProps> = ({
  responsiveness,
  githubRateLimited = false,
  githubIssuesUnavailable = false,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200 mb-2">
          <Users
            size={16}
            className="mr-2 text-slate-600 dark:text-slate-400"
          />{" "}
          Responsiveness
          <div className="group relative flex items-center ml-1.5 cursor-help">
            <Info size={14} className="text-slate-400 dark:text-slate-500" />
            <div className="hidden group-hover:block absolute z-50 w-48 p-2 bg-slate-800 text-white text-xs rounded-md bottom-full left-1/2 -translate-x-1/2 mb-2 shadow-lg text-center font-normal normal-case tracking-normal whitespace-normal">
              Measures how quickly maintainers close open issues and PRs.
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        </h2>
        {responsiveness ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {responsiveness.description}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Based on recent issues/PRs.
                </p>
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {Math.round((responsiveness.closedIssuesRatio ?? 0) * 100)}%
              </div>
            </div>
          </>
        ) : githubIssuesUnavailable || githubRateLimited ? (
          <p
            className="text-sm flex items-start gap-1.5 text-amber-700 dark:text-amber-400"
            title={
              githubRateLimited
                ? "Couldn't fetch — GitHub API rate limit reached. Add a Personal Access Token in Options."
                : "GitHub temporarily limited the issues query (Search API has a tight per-minute quota). Try again in a minute."
            }
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>Couldn&rsquo;t fetch issue activity right now.</span>
          </p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Not enough data to determine.
          </p>
        )}
      </div>

      {responsiveness && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium tracking-wide">
            Open Issues
          </span>
          <a
            href={responsiveness.issuesUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-semibold transition-colors"
          >
            {responsiveness.openIssuesCount.toLocaleString()} Open
          </a>
        </div>
      )}
    </div>
  );
};
