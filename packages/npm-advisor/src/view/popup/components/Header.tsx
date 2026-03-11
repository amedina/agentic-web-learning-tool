import React from "react";
import { Github, Star, Users, Clock } from "lucide-react";

interface HeaderProps {
  packageName: string;
  githubUrl: string | null;
  stars: number | null;
  collaboratorsCount: number | null;
  lastCommitDate: string | null;
  license: string | null;
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
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
}) => {
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1
              className="text-xl font-bold text-slate-900 truncate max-w-[200px]"
              title={packageName}
            >
              {packageName}
            </h1>
            <button
              onClick={onAddToCompare}
              disabled={isAddedToCompare}
              className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                isAddedToCompare
                  ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                  : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
              }`}
            >
              {isAddedToCompare ? "Added" : "+ Compare"}
            </button>
          </div>
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-1 transition-colors"
              title={githubUrl}
            >
              <Github size={14} className="mr-1" /> View Source
            </a>
          ) : (
            <p className="text-sm text-slate-400 mt-1">No repository linked</p>
          )}
        </div>
        <div className="text-right">
          {license && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
              {license}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
        <div className="flex flex-col items-center justify-self-start space-y-1">
          <div className="flex items-center text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Star size={12} className="mr-1 shadow-sm" /> Stars
          </div>
          <span className="font-medium text-slate-800 text-center">
            {stars !== null ? stars.toLocaleString() : "N/A"}
          </span>
        </div>
        <div className="flex flex-col items-center justify-self-center space-y-1">
          <div
            className="flex items-center text-xs text-slate-500 uppercase tracking-wider font-semibold"
            title="NPM Maintainers"
          >
            <Users size={12} className="mr-1" /> Collabs
          </div>
          <span className="font-medium text-slate-800 text-center">
            {collaboratorsCount ?? "N/A"}
          </span>
        </div>
        <div className="flex flex-col items-center justify-self-end space-y-1">
          <div className="flex items-center text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Clock size={12} className="mr-1" /> Last Commit
          </div>
          <span
            className="font-medium text-slate-800 text-center truncate w-full"
            title={lastCommitDate || "N/A"}
          >
            {lastCommitDate ? formatDate(lastCommitDate) : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
};
