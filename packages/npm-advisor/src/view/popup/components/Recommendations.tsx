import React from "react";
import { Info } from "lucide-react";

interface RecommendationsProps {
  recommendations: {
    nativeReplacements?: any;
    microUtilityReplacements?: any;
    preferredReplacements?: any;
  };
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
}) => {
  if (!Object.values(recommendations || {}).some((rec) => !!rec)) return null;

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
      <h2 className="text-sm font-semibold flex items-center text-amber-900 mb-2">
        <Info size={16} className="mr-2 text-amber-600" /> Alternative
        Recommendations
      </h2>
      <div className="space-y-3 pt-2">
        {recommendations.nativeReplacements && (
          <div className="text-sm text-amber-900 bg-amber-100/50 p-3 rounded-lg border border-amber-200/50">
            <strong className="block mb-2 font-semibold">
              Native APIs Available:
            </strong>
            {Array.isArray(recommendations.nativeReplacements)
              ? recommendations.nativeReplacements.map((r: any, idx) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    <p className="text-[13px] mb-1 leading-snug">
                      {r.description}
                    </p>
                    {r.example && (
                      <code className="block bg-amber-200/40 px-2 py-1.5 rounded text-xs font-mono text-amber-950 mt-1.5 overflow-x-auto">
                        {r.example}
                      </code>
                    )}
                  </div>
                ))
              : null}
          </div>
        )}

        {recommendations.microUtilityReplacements && (
          <div className="text-sm text-emerald-900 bg-emerald-50 p-3 rounded-lg border border-emerald-200/50">
            <strong className="block mb-2 font-semibold">
              Micro-utility Replacement:
            </strong>
            {Array.isArray(recommendations.microUtilityReplacements)
              ? recommendations.microUtilityReplacements.map((r: any, idx) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    <p className="text-[13px] mb-1 leading-snug">
                      {r.description}
                    </p>
                    {r.example && (
                      <code className="block bg-emerald-100/80 px-2 py-1.5 rounded text-xs font-mono text-emerald-950 mt-1.5 overflow-x-auto">
                        {r.example}
                      </code>
                    )}
                  </div>
                ))
              : null}
          </div>
        )}

        {recommendations.preferredReplacements && (
          <div className="text-sm text-blue-900 bg-blue-50 p-3 rounded-lg border border-blue-200/50">
            <strong className="block mb-2 font-semibold">
              Preferred Alternative Library:
            </strong>
            {Array.isArray(recommendations.preferredReplacements)
              ? recommendations.preferredReplacements.map((r: any, idx) => (
                  <div key={idx} className="mb-2 last:mb-0">
                    <p className="text-[13px] leading-snug">{r.description}</p>
                  </div>
                ))
              : null}
          </div>
        )}
      </div>
    </div>
  );
};
