/**
 * External dependencies.
 */
import React from "react";
import { Github, Star, Users, Clock, Activity, Info } from "lucide-react";

export interface HeaderProps {
  packageName: string;
  githubUrl: string | null;
  stars: number | null;
  collaboratorsCount: number | null;
  lastCommitDate: string | null;
  license: string | null;
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
  score: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  packageName,
  githubUrl,
  stars,
  collaboratorsCount,
  lastCommitDate,
  license,
  onAddToCompare,
  isAddedToCompare,
  score,
}) => {
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1
              className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]"
              title={packageName}
            >
              {packageName}
            </h1>
            {isAddedToCompare ? (
              <button
                onClick={() => {
                  chrome.tabs.create({
                    url: chrome.runtime.getURL(
                      "options/options.html#comparison",
                    ),
                  });
                }}
                className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center space-x-1 cursor-pointer`}
              >
                <span>View Comparison</span>
              </button>
            ) : (
              <button
                onClick={onAddToCompare}
                className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer`}
              >
                + Compare
              </button>
            )}
          </div>
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center mt-1 transition-colors cursor-pointer"
              title={githubUrl}
            >
              <Github size={14} className="mr-1" /> View Source
            </a>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              No repository linked
            </p>
          )}
        </div>
        <div className="text-right">
          <span
            className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 truncate max-w-[150px]"
            title={license ?? "Unknown"}
          >
            {license ?? "Unknown"}
          </span>
        </div>
      </div>

      <div className="flex items-start justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex flex-col items-center space-y-1">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">
            <Activity size={12} className="mr-1 shadow-sm" /> Score
            <div className="group relative flex items-center ml-1 cursor-help">
              <Info size={12} className="text-slate-400 dark:text-slate-500" />
              <div className="hidden group-hover:block absolute z-50 w-48 p-2 bg-slate-800 text-white text-xs rounded-md bottom-full left-1/2 -translate-x-1/2 mb-2 shadow-lg text-center font-normal normal-case tracking-normal whitespace-normal">
                Calculated based on Bundle Size, Dependencies, and Modern
                Replacements.
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
          <span className="font-bold text-[#c94137] text-lg leading-none text-center">
            {score !== null ? score : "N/A"}
          </span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">
            <Star size={12} className="mr-1 shadow-sm" /> Stars
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {stars !== null ? stars.toLocaleString() : "N/A"}
          </span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div
            className="flex items-center text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap"
            title="NPM Maintainers"
          >
            <Users size={12} className="mr-1" /> Collabs
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {collaboratorsCount ?? "N/A"}
          </span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold whitespace-nowrap">
            <Clock size={12} className="mr-1" /> Last Commit
          </div>
          <span
            className="font-medium text-slate-800 dark:text-slate-200 text-center whitespace-nowrap"
            title={lastCommitDate || "N/A"}
          >
            {lastCommitDate ? formatDate(lastCommitDate) : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
};
