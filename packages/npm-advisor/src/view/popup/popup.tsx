import React, { useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  PackageSearch,
  Github,
  Star,
  Users,
  ShieldAlert,
  HardDrive,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Leaf,
  Info,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import Tree from "rc-tree";
import type { DataNode } from "rc-tree/lib/interface";
import { type PackageStats } from "../../utils/stats";
import type { DependencyTree } from "../../utils/api";
import "./popup.css";

// ---------------------------------------------------------------------- //
//                            Error Boundary                              //
// ---------------------------------------------------------------------- //
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 w-[400px] h-[300px] bg-red-50 text-red-800 text-center overflow-auto antialiased">
          <XCircle size={40} className="text-red-500 mb-4" />
          <p className="font-semibold text-red-700 mb-2">Popup UI Crashed</p>
          <pre className="text-[10px] text-left w-full bg-red-100 p-2 rounded overflow-x-auto">
            {this.state.error?.message}
            {"\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------- //
//                            Helper Utilities                            //
// ---------------------------------------------------------------------- //
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const mapDependencyTreeToRC = (tree: DependencyTree | null): DataNode[] => {
  if (!tree) return [];
  const versionStr = tree.resolvedVersion || tree.requestedVersion || "unknown";
  return [
    {
      key: tree.name + "@" + versionStr,
      title: `${tree.name} (${versionStr})`,
      children: tree.dependencies
        ? Object.values(tree.dependencies).map(
            (dep) => mapDependencyTreeToRC(dep)[0],
          )
        : [],
    },
  ];
};

// ---------------------------------------------------------------------- //
//                             Main Component                             //
// ---------------------------------------------------------------------- //
export const Popup = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PackageStats | null>(null);

  useEffect(() => {
    const fetchCurrentTabStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Query chrome active tab
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tab?.url;

        if (!url) {
          throw new Error("Could not determine current tab URL.");
        }

        let packageName: string | null = null;
        if (url.includes("npmjs.com/package/")) {
          const match = url.match(/npmjs\.com\/package\/([^/?#]+)/);
          if (match && match[1]) {
            packageName = decodeURIComponent(match[1]);
          }
        } else if (
          url.includes("github.com") &&
          url.endsWith("package.json") &&
          url.includes("/blob/")
        ) {
          const rawUrl = url.replace("/blob/", "/raw/");
          const response = await fetch(rawUrl);
          if (response.ok) {
            const pkg = await response.json();
            if (pkg && pkg.name) {
              packageName = pkg.name;
            }
          }
        }

        if (!packageName) {
          throw new Error(
            "Navigate to an NPM package or a GitHub package.json page to view stats.",
          );
        }

        // Ask background script for the cached stats payload
        chrome.runtime.sendMessage(
          { type: "GET_STATS", packageName },
          (response) => {
            if (chrome.runtime.lastError) {
              setLoading(false);
              return setError(
                chrome.runtime.lastError.message ||
                  "Failed to communicate with background script.",
              );
            }
            if (response && response.success) {
              if (response.data) {
                setStats(response.data);
              } else {
                setError("Failed to load statistics for this package.");
              }
            } else {
              setError(
                response?.error ||
                  "Failed to load statistics for this package.",
              );
            }
            setLoading(false);
          },
        );
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
        setLoading(false);
      }
    };

    fetchCurrentTabStats();
  }, []);

  const treeData = useMemo(() => {
    return stats?.dependencyTree
      ? mapDependencyTreeToRC(stats.dependencyTree)
      : [];
  }, [stats?.dependencyTree]);

  // ---------------------------------------------------------------------- //
  //                                UI Render                                //
  // ---------------------------------------------------------------------- //
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 w-[400px] h-[300px] bg-slate-50 text-slate-800">
        <div className="animate-spin text-blue-500 mb-4">
          <PackageSearch size={40} />
        </div>
        <p className="font-medium">Analyzing Package Data...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-6 w-[400px] bg-slate-50 text-slate-800 text-center">
        <XCircle size={40} className="text-red-500 mb-4" />
        <p className="font-semibold text-red-700">
          {error || "No stats found"}
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Open a package page on npmjs.com or a package.json on GitHub.
        </p>
      </div>
    );
  }

  const {
    packageName,
    githubUrl,
    stars,
    collaboratorsCount,
    lastCommitDate,
    responsiveness,
    securityAdvisories,
    bundle,
    license,
    licenseCompatibility,
    recommendations,
  } = stats;

  return (
    <div className="flex flex-col w-[500px] max-h-[600px] overflow-y-auto bg-slate-50 text-slate-800 antialiased p-4 space-y-4">
      {/* Header Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-xl font-bold text-slate-900 truncate max-w-[300px]"
              title={packageName}
            >
              {packageName}
            </h1>
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
              <p className="text-sm text-slate-400 mt-1">
                No repository linked
              </p>
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
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <Star size={12} className="mr-1" /> Stars
            </div>
            <span className="font-medium text-slate-800">
              {stars !== null ? stars.toLocaleString() : "N/A"}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <Users size={12} className="mr-1" /> Collabs
            </div>
            <span className="font-medium text-slate-800">
              {collaboratorsCount ?? "N/A"}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <Clock size={12} className="mr-1" /> Updated
            </div>
            <span
              className="font-medium text-slate-800 truncate"
              title={lastCommitDate || "N/A"}
            >
              {lastCommitDate
                ? new Date(lastCommitDate).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Security & Health */}
      <div className="grid grid-cols-2 gap-4">
        {/* Compliance / License */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-2">
            <ShieldAlert size={16} className="mr-2 text-slate-600" /> License
            Check
          </h2>
          {licenseCompatibility ? (
            <div
              className={`p-2 rounded-lg flex items-start space-x-2 ${licenseCompatibility.isCompatible ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
            >
              {licenseCompatibility.isCompatible ? (
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
              ) : (
                <XCircle size={16} className="mt-0.5 shrink-0" />
              )}
              <div className="text-sm">
                <p className="font-medium leading-tight">
                  {licenseCompatibility.isCompatible
                    ? "Compatible with MIT"
                    : "Incompatible License"}
                </p>
                {licenseCompatibility.explanation &&
                  licenseCompatibility.explanation !== "n.a." && (
                    <p className="text-xs mt-1 opacity-80 leading-snug">
                      {licenseCompatibility.explanation}
                    </p>
                  )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Unknown compatibility status
            </p>
          )}
        </div>

        {/* Maintainer Response */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-2">
            <Users size={16} className="mr-2 text-slate-600" /> Responsiveness
          </h2>
          {responsiveness ? (
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
          ) : (
            <p className="text-sm text-slate-500">
              Not enough data to determine.
            </p>
          )}
        </div>
      </div>

      {/* Bundle Info */}
      {bundle && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-3">
            <Zap size={16} className="mr-2 text-slate-600" /> Bundle footprint
          </h2>
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col items-center justify-center">
              <HardDrive size={20} className="text-slate-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Minified
              </span>
              <span className="text-lg font-semibold text-slate-800">
                {formatBytes(bundle.size)}
              </span>
            </div>
            <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col items-center justify-center">
              <Zap size={20} className="text-amber-400 mb-1" />
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                GZipped
              </span>
              <span className="text-lg font-semibold text-slate-800">
                {formatBytes(bundle.gzip)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-col space-y-2 text-sm max-w-full">
            <div className="flex items-center justify-between">
              <span className="flex items-center text-slate-600">
                <Leaf size={14} className="mr-2 text-emerald-500" />{" "}
                Tree-shakeable
              </span>
              <span className="font-medium">
                {bundle.isTreeShakeable ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center text-slate-600">
                <Info size={14} className="mr-2 text-blue-500" /> Side Effects
              </span>
              <span
                className="font-medium truncate max-w-[150px] text-right"
                title={String(bundle.hasSideEffects)}
              >
                {Array.isArray(bundle.hasSideEffects)
                  ? `${bundle.hasSideEffects.length} files`
                  : bundle.hasSideEffects
                    ? "Yes"
                    : "No"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Security Advisories List */}
      {securityAdvisories && securityAdvisories.issues.length > 0 && (
        <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-4">
          <h2 className="text-sm font-semibold flex items-center text-red-800 mb-2">
            <ShieldAlert size={16} className="mr-2" /> Security Advisories (
            {securityAdvisories.issues.length})
          </h2>
          <ul className="space-y-2 mt-2">
            {securityAdvisories.issues.slice(0, 3).map((issue, idx) => (
              <li
                key={idx}
                className="text-xs bg-white rounded p-2 border border-red-100 flex flex-col"
              >
                <div className="flex items-center mb-1">
                  <span
                    className={`px-1.5 py-0.5 rounded uppercase text-[10px] font-bold mr-2 ${issue.severity === "critical" ? "bg-red-600 text-white" : issue.severity === "high" ? "bg-orange-500 text-white" : "bg-yellow-400 text-yellow-900"}`}
                  >
                    {issue.severity}
                  </span>
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-700 hover:underline truncate"
                  >
                    {issue.summary}
                  </a>
                </div>
              </li>
            ))}
            {securityAdvisories.issues.length > 3 && (
              <li className="text-xs text-red-600 italic">
                +{securityAdvisories.issues.length - 3} more vulnerabilities
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Module Replacements / Recommendations */}
      {Object.values(recommendations || {}).some((rec) => !!rec) && (
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-4">
          <h2 className="text-sm font-semibold flex items-center text-amber-900 mb-2">
            <Info size={16} className="mr-2 text-amber-600" /> Alternative
            Recommendations
          </h2>
          <div className="space-y-3">
            {recommendations.nativeReplacements && (
              <div className="text-sm text-amber-800 bg-amber-100/50 p-2 rounded border border-amber-200/50">
                <strong className="block mb-1">Native APIs Available:</strong>
                {Array.isArray(recommendations.nativeReplacements)
                  ? recommendations.nativeReplacements.map((r: any, idx) => (
                      <div key={idx} className="mb-2 last:mb-0">
                        <p className="text-xs mb-1">{r.description}</p>
                        {r.example && (
                          <code className="block bg-amber-200/40 px-2 py-1 rounded text-xs font-mono">
                            {r.example}
                          </code>
                        )}
                      </div>
                    ))
                  : null}
              </div>
            )}

            {recommendations.microUtilityReplacements && (
              <div className="text-sm text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200/50">
                <strong className="block mb-1">
                  Micro-utility Replacement:
                </strong>
                {Array.isArray(recommendations.microUtilityReplacements)
                  ? recommendations.microUtilityReplacements.map(
                      (r: any, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <p className="text-xs mb-1">{r.description}</p>
                          {r.example && (
                            <code className="block bg-emerald-100/80 px-2 py-1 rounded text-xs font-mono">
                              {r.example}
                            </code>
                          )}
                        </div>
                      ),
                    )
                  : null}
              </div>
            )}

            {recommendations.preferredReplacements && (
              <div className="text-sm text-blue-800 bg-blue-50 p-2 rounded border border-blue-200/50">
                <strong className="block mb-1">
                  Preferred Alternative Library:
                </strong>
                {Array.isArray(recommendations.preferredReplacements)
                  ? recommendations.preferredReplacements.map((r: any, idx) => (
                      <div key={idx} className="mb-2 last:mb-0">
                        <p className="text-xs mb-1">{r.description}</p>
                      </div>
                    ))
                  : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dependency Tree Map */}
      {treeData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 overflow-hidden">
          <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-3 border-b border-slate-100 pb-2">
            Dependencies
          </h2>
          <div className="text-sm max-h-[300px] overflow-auto">
            <Tree
              treeData={treeData}
              defaultExpandAll={false}
              defaultExpandedKeys={[treeData[0]?.key as string]}
              showIcon={false}
              showLine={true}
              switcherIcon={({ expanded }) =>
                expanded ? (
                  <ChevronDown size={14} className="mt-1 opacity-60" />
                ) : (
                  <ChevronRight size={14} className="mt-1 opacity-60" />
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------- //
//                            Bootstrapping                               //
// ---------------------------------------------------------------------- //
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Popup />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
