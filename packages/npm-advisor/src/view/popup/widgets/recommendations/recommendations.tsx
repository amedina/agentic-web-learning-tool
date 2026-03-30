/**
 * External dependencies.
 */
import React from "react";
import { Info } from "lucide-react";

export interface RecommendationsProps {
  recommendations: {
    nativeReplacements?: any;
    microUtilityReplacements?: any[];
    preferredReplacements?: any[];
  };
}

import { getRecommendationUrl } from "./utils/getRecommendationUrl";

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
}) => {
  if (!Object.values(recommendations || {}).some((rec) => !!rec)) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200 mb-3">
        <Info size={16} className="mr-2 text-slate-600 dark:text-slate-400" />{" "}
        Alternative Recommendations
      </h2>
      <div className="space-y-3">
        {recommendations.nativeReplacements && (
          <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200/80 dark:border-slate-600">
            <strong className="block mb-2 font-semibold text-slate-800 dark:text-slate-200">
              Native APIs Available:
            </strong>
            {Array.isArray(recommendations.nativeReplacements)
              ? recommendations.nativeReplacements.map((r: any, idx) => {
                  const linkUrl = getRecommendationUrl(r);
                  return (
                    <div key={idx} className="mb-3 last:mb-0">
                      {linkUrl ? (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[13px] leading-snug text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors block"
                          title={`View ${r.description || r.replacementModule || r.id}`}
                        >
                          {r.description || r.replacementModule || r.id}
                        </a>
                      ) : (
                        <p className="text-[13px] mb-1 leading-snug">
                          {r.description || r.replacementModule || r.id}
                        </p>
                      )}
                      {r.example && (
                        <code className="block bg-slate-100 dark:bg-slate-600 px-2 py-1.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200 mt-1.5 border border-slate-200/60 dark:border-slate-500 overflow-x-auto">
                          {r.example}
                        </code>
                      )}
                    </div>
                  );
                })
              : null}
          </div>
        )}

        {recommendations.microUtilityReplacements && (
          <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200/80 dark:border-slate-600">
            <strong className="block mb-2 font-semibold text-slate-800 dark:text-slate-200">
              Micro-utility Replacement:
            </strong>
            {Array.isArray(recommendations.microUtilityReplacements)
              ? recommendations.microUtilityReplacements.map((r: any, idx) => {
                  const linkUrl = getRecommendationUrl(r);
                  return (
                    <div key={idx} className="mb-3 last:mb-0">
                      {linkUrl ? (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[13px] leading-snug text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors block"
                          title={`View ${r.description || r.replacementModule || r.id}`}
                        >
                          {r.description || r.replacementModule || r.id}
                        </a>
                      ) : (
                        <p className="text-[13px] mb-1 leading-snug">
                          {r.description || r.replacementModule || r.id}
                        </p>
                      )}
                      {r.example && (
                        <code className="block bg-slate-100 dark:bg-slate-600 px-2 py-1.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200 mt-1.5 border border-slate-200/60 dark:border-slate-500 overflow-x-auto">
                          {r.example}
                        </code>
                      )}
                    </div>
                  );
                })
              : null}
          </div>
        )}

        {recommendations.preferredReplacements && (
          <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200/80 dark:border-slate-600">
            <strong className="block mb-2 font-semibold text-slate-800 dark:text-slate-200">
              Preferred Alternative Library:
            </strong>
            {Array.isArray(recommendations.preferredReplacements)
              ? recommendations.preferredReplacements.map((r: any, idx) => {
                  const linkUrl = getRecommendationUrl(r);
                  return (
                    <div key={idx} className="mb-2 last:mb-0">
                      {linkUrl ? (
                        <a
                          href={linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[13px] leading-snug text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                          title={`View ${r.replacementModule || r.description || r.id} on NPM`}
                        >
                          {r.description || r.replacementModule || r.id}
                        </a>
                      ) : (
                        <p className="text-[13px] leading-snug">
                          {r.description || r.replacementModule || r.id}
                        </p>
                      )}
                    </div>
                  );
                })
              : null}
          </div>
        )}
      </div>
    </div>
  );
};
