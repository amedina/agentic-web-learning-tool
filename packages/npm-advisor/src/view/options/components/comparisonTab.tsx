/**
 * External dependencies.
 */
import React from "react";
import { BarChart2, Trash2, Award } from "lucide-react";

/**
 * Internal dependencies.
 */
import { calculateScore } from "../../../utils/calculateScore";

interface ComparisonTabProps {
  comparisonBucket: any[];
  handleClearComparison: () => void;
  winnerName: string | null;
}

/**
 * Comparison Tab.
 */
export const ComparisonTab: React.FC<ComparisonTabProps> = ({
  comparisonBucket,
  handleClearComparison,
  winnerName,
}) => {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Package Comparison
        </h3>
        {comparisonBucket.length > 0 && (
          <button
            onClick={handleClearComparison}
            className="flex items-center text-sm text-red-600 hover:text-red-700 transition-colors font-medium border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Bucket
          </button>
        )}
      </div>

      {comparisonBucket.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            Your comparison bucket is empty.
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Visit an NPM package and click "+ Compare" in the popup menu.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-900 border-r border-slate-200">
                  Metric
                </th>
                {comparisonBucket.map((pkg, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-4 text-left font-semibold text-slate-900 border-r border-slate-200 min-w-[200px] relative"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{pkg.packageName}</span>
                      {winnerName === pkg.packageName && (
                        <span className="flex items-center bg-green-100 text-green-700 border border-green-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full absolute top-2 right-2">
                          <Award className="w-3 h-3 mr-1" />
                          Winner
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  Advisor Score
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 font-bold text-[#c94137] border-r border-slate-200 text-lg"
                  >
                    {calculateScore(pkg)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  GitHub Stars
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {pkg.stars?.toLocaleString() || "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  Collaborators
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {pkg.collaboratorsCount !== null
                      ? pkg.collaboratorsCount
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  Last Commit
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {pkg.lastCommitDate
                      ? new Date(pkg.lastCommitDate).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  Minified Size
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {pkg.bundle?.size
                      ? `${(pkg.bundle.size / 1024).toFixed(1)} kB`
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  GZipped Size
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {pkg.bundle?.gzip ? (
                      <span className="font-semibold text-slate-700">{`${(pkg.bundle.gzip / 1024).toFixed(1)} kB`}</span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  Tree Shakeable
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {pkg.bundle?.isTreeShakeable ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : pkg.bundle?.isTreeShakeable === false ? (
                      <span className="text-red-500">No</span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  Side Effects
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {pkg.bundle?.hasSideEffects === false ? (
                      <span className="text-green-600 font-medium">No</span>
                    ) : pkg.bundle?.hasSideEffects === true ||
                      Array.isArray(pkg.bundle?.hasSideEffects) ? (
                      <span className="text-yellow-600">Yes</span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  Total Dependencies
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {Object.keys(pkg.dependencyTree?.dependencies || {}).length}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  Responsiveness
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {pkg.responsiveness?.description ? (
                      <div className="flex items-center mb-1">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            pkg.responsiveness.description === "Needs Attention"
                              ? "bg-red-500"
                              : pkg.responsiveness.description ===
                                  "Moderately Responsive"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                        ></span>
                        {pkg.responsiveness.description}
                      </div>
                    ) : (
                      <div className="mb-1 text-slate-400">Unknown</div>
                    )}
                    <div className="text-xs text-slate-400">
                      Open Issues: {pkg.responsiveness?.openIssuesCount || 0}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  Security Advisories
                </td>
                {comparisonBucket.map((pkg, idx) => {
                  const adv = pkg.securityAdvisories;
                  return (
                    <td
                      key={idx}
                      className="px-6 py-4 text-slate-500 border-r border-slate-200"
                    >
                      {!adv ? (
                        "Unknown"
                      ) : adv.critical === 0 &&
                        adv.high === 0 &&
                        adv.moderate === 0 &&
                        adv.low === 0 ? (
                        <span className="text-green-600 font-medium">None</span>
                      ) : (
                        <div className="flex flex-col space-y-1 text-xs">
                          {adv.critical > 0 && (
                            <span className="text-red-600 font-bold">
                              {adv.critical} Critical
                            </span>
                          )}
                          {adv.high > 0 && (
                            <span className="text-red-500 font-semibold">
                              {adv.high} High
                            </span>
                          )}
                          {adv.moderate > 0 && (
                            <span className="text-yellow-600">
                              {adv.moderate} Moderate
                            </span>
                          )}
                          {adv.low > 0 && (
                            <span className="text-slate-500">
                              {adv.low} Low
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 bg-slate-50 border-r border-slate-200">
                  License Match
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 border-r border-slate-200"
                  >
                    {pkg.licenseCompatibility?.isCompatible ? (
                      <span className="text-green-600 font-medium tracking-wide">
                        Yes
                      </span>
                    ) : (
                      <span className="text-red-500">
                        No ({pkg.license || "Default"})
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {comparisonBucket.length > 0 && winnerName && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <h4 className="flex items-center text-green-800 font-semibold mb-1">
            <Award className="w-5 h-5 mr-2" />
            Winner: {winnerName}
          </h4>
          <p className="text-sm text-green-700">
            Based on bundle sizes, dependency counts, and modern native
            alternatives metrics,{" "}
            <span className="font-bold">{winnerName}</span> emerged as the most
            efficient choice in this comparison bucket.
          </p>
        </div>
      )}
    </div>
  );
};
