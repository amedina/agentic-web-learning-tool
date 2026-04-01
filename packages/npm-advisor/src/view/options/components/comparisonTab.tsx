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
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-accent-foreground">
          Package Comparison
        </h3>
        {comparisonBucket.length > 0 && (
          <button
            onClick={handleClearComparison}
            className="flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors font-medium border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 px-3 py-1.5 rounded-md"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Bucket
          </button>
        )}
      </div>

      {comparisonBucket.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <BarChart2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Your comparison bucket is empty.
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            Visit an NPM package and click &quot;+ Compare&quot; in the popup
            menu.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800 text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700">
                  Metric
                </th>
                {comparisonBucket.map((pkg, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-4 text-left font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 min-w-[200px] relative"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{pkg.packageName}</span>
                      {winnerName === pkg.packageName && (
                        <span className="flex items-center bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full absolute top-2 right-2">
                          <Award className="w-3 h-3 mr-1" />
                          Winner
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Advisor Score
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 font-bold text-[#c94137] border-r border-slate-200 dark:border-slate-700 text-lg"
                  >
                    {calculateScore(pkg)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  GitHub Stars
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.stars?.toLocaleString() || "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Collaborators
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.collaboratorsCount !== null
                      ? pkg.collaboratorsCount
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Last Commit
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
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
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Minified Size
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.bundle?.size
                      ? `${(pkg.bundle.size / 1024).toFixed(1)} kB`
                      : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  GZipped Size
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.bundle?.gzip ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {`${(pkg.bundle.gzip / 1024).toFixed(1)} kB`}
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Tree Shakeable
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.bundle?.isTreeShakeable ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Yes
                      </span>
                    ) : pkg.bundle?.isTreeShakeable === false ? (
                      <span className="text-red-500 dark:text-red-400">No</span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Side Effects
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.bundle?.hasSideEffects === false ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        No
                      </span>
                    ) : pkg.bundle?.hasSideEffects === true ||
                      Array.isArray(pkg.bundle?.hasSideEffects) ? (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Total Dependencies
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                  >
                    {Object.keys(pkg.dependencyTree?.dependencies || {}).length}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Responsiveness
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
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
                        />
                        {pkg.responsiveness.description}
                      </div>
                    ) : (
                      <div className="mb-1 text-slate-400 dark:text-slate-500">
                        Unknown
                      </div>
                    )}
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      Open Issues: {pkg.responsiveness?.openIssuesCount || 0}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  Security Advisories
                </td>
                {comparisonBucket.map((pkg, idx) => {
                  const adv = pkg.securityAdvisories;
                  return (
                    <td
                      key={idx}
                      className="px-6 py-4 text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700"
                    >
                      {!adv ? (
                        "Unknown"
                      ) : adv.critical === 0 &&
                        adv.high === 0 &&
                        adv.moderate === 0 &&
                        adv.low === 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          None
                        </span>
                      ) : (
                        <div className="flex flex-col space-y-1 text-xs">
                          {adv.critical > 0 && (
                            <span className="text-red-600 dark:text-red-400 font-bold">
                              {adv.critical} Critical
                            </span>
                          )}
                          {adv.high > 0 && (
                            <span className="text-red-500 dark:text-red-400 font-semibold">
                              {adv.high} High
                            </span>
                          )}
                          {adv.moderate > 0 && (
                            <span className="text-yellow-600 dark:text-yellow-400">
                              {adv.moderate} Moderate
                            </span>
                          )}
                          {adv.low > 0 && (
                            <span className="text-slate-500 dark:text-slate-400">
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
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
                  License Match
                </td>
                {comparisonBucket.map((pkg, idx) => (
                  <td
                    key={idx}
                    className="px-6 py-4 border-r border-slate-200 dark:border-slate-700"
                  >
                    {pkg.licenseCompatibility?.isCompatible ? (
                      <span className="text-green-600 dark:text-green-400 font-medium tracking-wide">
                        Yes
                      </span>
                    ) : (
                      <span className="text-red-500 dark:text-red-400">
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
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <h4 className="flex items-center text-green-800 dark:text-green-300 font-semibold mb-1">
            <Award className="w-5 h-5 mr-2" />
            Winner: {winnerName}
          </h4>
          <p className="text-sm text-green-700 dark:text-green-400">
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
