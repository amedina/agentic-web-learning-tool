import React from "react";
import { Users, Info } from "lucide-react";

interface ResponsivenessProps {
  responsiveness: {
    description: string;
    closedIssuesRatio: number | null;
    openIssuesCount: number;
    issuesUrl: string;
  } | null;
}

export const Responsiveness: React.FC<ResponsivenessProps> = ({
  responsiveness,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-2">
          <Users size={16} className="mr-2 text-slate-600" /> Responsiveness
          <div className="group relative flex items-center ml-1.5 cursor-help">
            <Info size={14} className="text-slate-400" />
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
                <p className="text-sm font-medium text-slate-700">
                  {responsiveness.description}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Based on recent issues/PRs.
                </p>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {Math.round((responsiveness.closedIssuesRatio ?? 0) * 100)}%
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Not enough data to determine.
          </p>
        )}
      </div>

      {responsiveness && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium tracking-wide">
            Open Issues
          </span>
          <a
            href={responsiveness.issuesUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
          >
            {responsiveness.openIssuesCount.toLocaleString()} Open
          </a>
        </div>
      )}
    </div>
  );
};
