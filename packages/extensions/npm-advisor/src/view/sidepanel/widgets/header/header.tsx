/**
 * External dependencies.
 */
import React from "react";
import { Github, Star, Users, Clock, Activity, Info } from "lucide-react";
import { usePropProvider } from "@google-awlt/chatbot";
import { Tooltip } from "@google-awlt/design-system";

/**
 * Internal dependencies.
 */
import { type ScoreBreakdownItem } from "../../../../lib";

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
  scoreBreakdown?: ScoreBreakdownItem[];
  scoreMaxPoints?: number;
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
  scoreBreakdown,
  scoreMaxPoints,
}) => {
  const { setActiveTab } = usePropProvider(({ actions }) => ({
    setActiveTab: actions.setActiveTab,
  }));

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
                onClick={() => setActiveTab("comparison")}
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
            <Tooltip
              placement="bottom"
              delayDuration={0}
              contentClassName="w-64 p-3 text-left font-normal normal-case tracking-normal bg-slate-800 text-white shadow-lg"
              body={
                scoreBreakdown && scoreBreakdown.length > 0 ? (
                  <div>
                    <p className="font-semibold mb-2 text-sm">
                      Score {score ?? 0}{" "}
                      <span className="text-slate-400">
                        / {scoreMaxPoints ?? 0}
                      </span>
                    </p>
                    <ul className="space-y-2">
                      {scoreBreakdown.map((item) => {
                        const isUnavailable = item.status === "unavailable";
                        const isPenalty = item.status === "penalty";
                        return (
                          <li
                            key={item.label}
                            className="flex items-start justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <span
                                className={`text-xs font-medium ${
                                  isUnavailable
                                    ? "text-slate-400"
                                    : isPenalty
                                      ? "text-red-300"
                                      : ""
                                }`}
                              >
                                {item.label}
                              </span>
                              <span
                                className={`block text-[11px] leading-snug ${
                                  isUnavailable
                                    ? "italic text-slate-500"
                                    : isPenalty
                                      ? "text-red-200/80"
                                      : "text-slate-300"
                                }`}
                              >
                                {item.reason}
                              </span>
                            </div>
                            <span
                              className={`shrink-0 tabular-nums text-xs ${
                                isUnavailable
                                  ? "text-slate-500"
                                  : isPenalty
                                    ? "text-red-300"
                                    : ""
                              }`}
                            >
                              {isUnavailable ? (
                                "—"
                              ) : isPenalty ? (
                                `${item.points}`
                              ) : (
                                <>
                                  +{item.points}{" "}
                                  <span className="text-slate-400">
                                    / {item.maxPoints}
                                  </span>
                                </>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {scoreBreakdown.some((i) => i.status === "unavailable") && (
                      <p className="mt-2 pt-2 border-t border-slate-700 text-[11px] text-slate-400 leading-snug">
                        Axes marked — were excluded because the required data
                        wasn&rsquo;t available.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs">
                    Calculated based on Bundle Size, Dependencies, and Modern
                    Replacements.
                  </p>
                )
              }
            >
              <button
                type="button"
                aria-label="How is this score calculated?"
                className="ml-1 flex items-center cursor-help focus:outline-none"
              >
                <Info
                  size={12}
                  className="text-slate-400 dark:text-slate-500"
                />
              </button>
            </Tooltip>
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
