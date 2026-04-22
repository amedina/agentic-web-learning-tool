/**
 * External dependencies.
 */
import React, { useState, useEffect, useMemo } from "react";
import { Award, Trash2, X } from "lucide-react";

/**
 * Internal dependencies.
 */
import { calculateScore } from "../../lib/calculateScore";

interface SidepanelComparisonTableProps {
  onClear?: () => void;
  showHeader?: boolean;
}

export const SidepanelComparisonTable: React.FC<
  SidepanelComparisonTableProps
> = ({ onClear, showHeader = true }) => {
  const [comparisonBucket, setComparisonBucket] = useState<any[]>([]);

  useEffect(() => {
    chrome.storage.local.get(["comparisonBucket"], (res) => {
      setComparisonBucket((res.comparisonBucket as any[]) ?? []);
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      if ("comparisonBucket" in changes) {
        setComparisonBucket((changes.comparisonBucket.newValue as any[]) ?? []);
      }
    };
    chrome.storage.local.onChanged.addListener(listener);
    return () => chrome.storage.local.onChanged.removeListener(listener);
  }, []);

  const winnerName = useMemo(() => {
    if (comparisonBucket.length === 0) return null;
    let bestScore = -Infinity;
    let winner: string | null = null;
    comparisonBucket.forEach((pkg) => {
      const score = calculateScore(pkg);
      if (score > bestScore) {
        bestScore = score;
        winner = pkg.packageName;
      }
    });
    return winner;
  }, [comparisonBucket]);

  if (comparisonBucket.length === 0) return null;

  const handleClearComparison = () => {
    chrome.storage.local.set({ comparisonBucket: [] });
    onClear?.();
  };

  const handleRemovePackage = (packageName: string) => {
    const updated = comparisonBucket.filter(
      (p) => p.packageName !== packageName,
    );
    chrome.storage.local.set({ comparisonBucket: updated });
  };

  const rows: Array<{ label: string; render: (pkg: any) => React.ReactNode }> =
    [
      {
        label: "Advisor Score",
        render: (pkg) => (
          <span className="font-bold text-[#c94137] text-base">
            {calculateScore(pkg)}
          </span>
        ),
      },
      {
        label: "Description",
        render: (pkg) => (
          <span className="italic text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {pkg.description || "N/A"}
          </span>
        ),
      },
      {
        label: "GitHub Stars",
        render: (pkg) => pkg.stars?.toLocaleString() || "N/A",
      },
      {
        label: "Collaborators",
        render: (pkg) =>
          pkg.collaboratorsCount !== null ? pkg.collaboratorsCount : "N/A",
      },
      {
        label: "Last Commit",
        render: (pkg) =>
          pkg.lastCommitDate
            ? new Date(pkg.lastCommitDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "N/A",
      },
      {
        label: "Minified Size",
        render: (pkg) =>
          pkg.bundle?.size
            ? `${(pkg.bundle.size / 1024).toFixed(1)} kB`
            : "N/A",
      },
      {
        label: "GZipped Size",
        render: (pkg) =>
          pkg.bundle?.gzip ? (
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {`${(pkg.bundle.gzip / 1024).toFixed(1)} kB`}
            </span>
          ) : (
            "N/A"
          ),
      },
      {
        label: "Tree Shakeable",
        render: (pkg) =>
          pkg.bundle?.isTreeShakeable ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              Yes
            </span>
          ) : pkg.bundle?.isTreeShakeable === false ? (
            <span className="text-red-500 dark:text-red-400">No</span>
          ) : (
            <span className="text-slate-400">N/A</span>
          ),
      },
      {
        label: "Side Effects",
        render: (pkg) =>
          pkg.bundle?.hasSideEffects === false ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              No
            </span>
          ) : pkg.bundle?.hasSideEffects === true ||
            Array.isArray(pkg.bundle?.hasSideEffects) ? (
            <span className="text-yellow-600 dark:text-yellow-400">Yes</span>
          ) : (
            <span className="text-slate-400">N/A</span>
          ),
      },
      {
        label: "Total Dependencies",
        render: (pkg) =>
          Object.keys(pkg.dependencyTree?.dependencies || {}).length,
      },
      {
        label: "Responsiveness",
        render: (pkg) => (
          <>
            {pkg.responsiveness?.description ? (
              <div className="flex items-center mb-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                    pkg.responsiveness.description === "Needs Attention"
                      ? "bg-red-500"
                      : pkg.responsiveness.description ===
                          "Moderately Responsive"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                />
                <span className="text-xs">
                  {pkg.responsiveness.description}
                </span>
              </div>
            ) : (
              <div className="mb-1 text-slate-400 dark:text-slate-500 text-xs">
                Unknown
              </div>
            )}
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Open Issues: {pkg.responsiveness?.openIssuesCount || 0}
            </div>
          </>
        ),
      },
      {
        label: "Security",
        render: (pkg) => {
          const adv = pkg.securityAdvisories;
          if (!adv)
            return <span className="text-slate-400 text-xs">Unknown</span>;
          if (
            adv.critical === 0 &&
            adv.high === 0 &&
            adv.moderate === 0 &&
            adv.low === 0
          ) {
            return (
              <span className="text-green-600 dark:text-green-400 font-medium text-xs">
                None
              </span>
            );
          }
          return (
            <div className="flex flex-col space-y-0.5 text-xs">
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
          );
        },
      },
      {
        label: "License Match",
        render: (pkg) =>
          pkg.licenseCompatibility?.isCompatible ? (
            <span className="text-green-600 dark:text-green-400 font-medium text-xs">
              Yes
            </span>
          ) : (
            <span className="text-red-500 dark:text-red-400 text-xs">
              No ({pkg.license ?? "Unknown"})
            </span>
          ),
      },
    ];

  const lastRowLabel = rows[rows.length - 1]?.label;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {showHeader ? (
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Comparison ({comparisonBucket.length})
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={handleClearComparison}
          className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-[#c94137] dark:hover:text-[#c94137] transition-colors"
          title="Clear all"
        >
          <Trash2 className="w-3 h-3" />
          Clear All
        </button>
      </div>

      {/* Scrollable table area */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed">
          <thead className="bg-slate-100 dark:bg-slate-700/60">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300 border-r border-b border-slate-200 dark:border-slate-600 w-28 shrink-0 uppercase tracking-wide text-[10px]">
                Metric
              </th>
              {comparisonBucket.map((pkg, idx) => (
                <th
                  key={idx}
                  className={`px-3 py-[12px] text-left font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 ${idx !== comparisonBucket.length - 1 ? "border-r border-slate-200 dark:border-slate-600" : ""} w-36 relative`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs leading-tight">
                      {pkg.packageName}
                    </span>
                    <button
                      onClick={() => handleRemovePackage(pkg.packageName)}
                      className="shrink-0 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded"
                      title={`Remove ${pkg.packageName}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {winnerName === pkg.packageName && (
                    <span className="absolute bottom-[-10px] right-0 z-10 flex items-center gap-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full w-fit">
                      <Award className="w-2.5 h-2.5" />
                      Winner
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const isLast = row.label === lastRowLabel;
              const isEven = rowIdx % 2 === 0;
              const rowBg = isEven
                ? "bg-white dark:bg-slate-800"
                : "bg-slate-50 dark:bg-slate-800/50";
              return (
                <tr key={row.label} className={rowBg}>
                  <td
                    className={`px-3 font-medium text-slate-600 dark:text-slate-300 border-r ${!isLast ? "border-b" : ""} border-slate-200 dark:border-slate-700 align-top ${isLast ? "pt-2.5 pb-[15px]" : "py-2.5"}`}
                  >
                    {row.label}
                  </td>
                  {comparisonBucket.map((pkg, idx) => (
                    <td
                      key={idx}
                      className={`px-3 text-slate-500 dark:text-slate-400 align-top ${isLast ? "pt-2.5 pb-[15px]" : "py-2.5"} ${idx !== comparisonBucket.length - 1 ? "border-r border-slate-200 dark:border-slate-700" : ""} ${!isLast ? "border-b border-slate-200 dark:border-slate-700" : ""}`}
                    >
                      {row.render(pkg)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
