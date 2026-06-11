/**
 * External dependencies.
 */
import React, { useState } from "react";
import { ShieldAlert, AlertCircle, ShieldQuestion } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useCountUp } from "../../hooks/useCountUp";

export interface SecurityAdvisoriesProps {
  securityAdvisories: {
    issues: Array<{ summary: string; severity: string; url: string }>;
  } | null;
  /** True when a GitHub rate-limit prevented this signal from loading. */
  githubRateLimited?: boolean;
  /**
   * True when an advisory source we'd normally consult (OSV, or GitHub
   * advisories for a known repo) failed or was rate-limited. When no
   * advisories are found, this turns the silent empty state into an explicit
   * "coverage incomplete" note so "no advisories" isn't read as "known clean".
   */
  advisoryCoverageDegraded?: boolean;
  /**
   * Renders a placeholder shell while stats are still loading. Once the
   * fetch resolves, the widget reverts to its existing logic — including
   * returning null when there are no advisories.
   */
  isLoading?: boolean;
}

export const SecurityAdvisories: React.FC<SecurityAdvisoriesProps> = ({
  securityAdvisories,
  githubRateLimited = false,
  advisoryCoverageDegraded = false,
  isLoading = false,
}) => {
  const [showAll, setShowAll] = useState(false);
  const animatedIssueCount = useCountUp(securityAdvisories?.issues.length ?? 0);

  if (!securityAdvisories && isLoading && !githubRateLimited) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200 mb-2">
          <ShieldAlert
            size={16}
            className="mr-2 text-slate-600 dark:text-slate-400"
          />{" "}
          Security Advisories
        </h2>
        <div className="animate-pulse">
          <div className="h-2.5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  // Rate-limited but advisories never loaded — surface a small warning row
  // so the user knows the gap is transient, not the package's actual state.
  if (!securityAdvisories && githubRateLimited) {
    return (
      <div
        className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300"
        title="Couldn't fetch — GitHub API rate limit reached. Add a Personal Access Token in Options."
      >
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <span>
          Couldn&rsquo;t fetch security advisories — GitHub API rate limit
          reached.
        </span>
      </div>
    );
  }

  // No advisories to show, but at least one source couldn't be checked. Make
  // the gap explicit instead of rendering nothing, so an OSV/GitHub outage
  // isn't mistaken for a clean bill of health. (The rate-limit branch above
  // already covers the GitHub-rate-limit cause.)
  if (
    (!securityAdvisories || securityAdvisories.issues.length === 0) &&
    advisoryCoverageDegraded
  ) {
    return (
      <div
        className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300"
        title="An advisory source (OSV or GitHub) couldn't be reached, so this isn't a confirmed clean result."
      >
        <ShieldQuestion size={14} className="mt-0.5 shrink-0" />
        <span>
          No advisories found, but coverage was incomplete (a source
          couldn&rsquo;t be reached). Try refreshing.
        </span>
      </div>
    );
  }

  if (!securityAdvisories || securityAdvisories.issues.length === 0)
    return null;

  const visibleIssues = showAll
    ? securityAdvisories.issues
    : securityAdvisories.issues.slice(0, 3);
  const remaining = securityAdvisories.issues.length - 3;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
      <h2 className="text-sm font-semibold flex items-center text-red-800 dark:text-red-300 mb-2">
        <ShieldAlert
          size={16}
          className="mr-2 text-red-700 dark:text-red-400"
        />{" "}
        Security Advisories ({animatedIssueCount})
      </h2>
      <ul className="space-y-2 mt-2">
        {visibleIssues.map((issue, idx) => (
          <li
            key={idx}
            className="text-xs bg-white dark:bg-slate-800 rounded p-2 border border-red-100 dark:border-red-800 flex flex-col"
          >
            <div className="flex items-center mb-1">
              <span
                className={`px-1.5 py-0.5 rounded uppercase text-[10px] font-bold mr-2 ${issue.severity === "critical" ? "bg-red-600 text-white" : issue.severity === "high" ? "bg-orange-500 text-white" : "bg-yellow-400 text-yellow-900"}`}
              >
                {issue.severity}
              </span>
              <a
                href={issue.url}
                target="_blank"
                rel="noreferrer"
                className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors hover:underline truncate"
              >
                {issue.summary}
              </a>
            </div>
          </li>
        ))}
        {remaining > 0 && (
          <li>
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="text-xs text-red-600 dark:text-red-400 font-medium px-1 pt-1 hover:underline cursor-pointer"
            >
              {showAll
                ? "Show less"
                : `+${remaining} more vulnerabilit${remaining === 1 ? "y" : "ies"}`}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};
