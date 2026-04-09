/**
 * External dependencies.
 */
import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";

export interface SecurityAdvisoriesProps {
  securityAdvisories: {
    issues: Array<{ summary: string; severity: string; url: string }>;
  } | null;
}

export const SecurityAdvisories: React.FC<SecurityAdvisoriesProps> = ({
  securityAdvisories,
}) => {
  const [showAll, setShowAll] = useState(false);

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
        Security Advisories ({securityAdvisories.issues.length})
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
