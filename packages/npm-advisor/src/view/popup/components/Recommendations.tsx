/**
 * External dependencies.
 */
import React from "react";
import { Info } from "lucide-react";

interface RecommendationsProps {
  recommendations: {
    nativeReplacements?: any;
    microUtilityReplacements?: any[];
    preferredReplacements?: any[];
  };
}

function getRecommendationUrl(r: any): string | null {
  if (r.replacementModule) {
    return `https://www.npmjs.com/package/${r.replacementModule}`;
  }
  if (r.url) {
    switch (r.url.type) {
      case "mdn":
        return `https://developer.mozilla.org/en-US/docs/${r.url.id}`;
      case "github":
        return `https://github.com/${r.url.id}`;
      case "npm":
        return `https://www.npmjs.com/package/${r.url.id}`;
      case "e18e":
        return `https://e18e.dev`;
      default:
        return null;
    }
  }
  return null;
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
}) => {
  if (!Object.values(recommendations || {}).some((rec) => !!rec)) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-3">
        <Info size={16} className="mr-2 text-slate-600" /> Alternative
        Recommendations
      </h2>
      <div className="space-y-3">
        {recommendations.nativeReplacements && (
          <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <strong className="block mb-2 font-semibold text-slate-800">
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
                          className="text-[13px] leading-snug text-blue-600 hover:text-blue-800 hover:underline transition-colors block"
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
                        <code className="block bg-slate-100 px-2 py-1.5 rounded text-xs font-mono text-slate-800 mt-1.5 border border-slate-200/60 overflow-x-auto">
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
          <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <strong className="block mb-2 font-semibold text-slate-800">
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
                          className="text-[13px] leading-snug text-blue-600 hover:text-blue-800 hover:underline transition-colors block"
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
                        <code className="block bg-slate-100 px-2 py-1.5 rounded text-xs font-mono text-slate-800 mt-1.5 border border-slate-200/60 overflow-x-auto">
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
          <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <strong className="block mb-2 font-semibold text-slate-800">
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
                          className="text-[13px] leading-snug text-blue-600 hover:text-blue-800 hover:underline transition-colors"
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
