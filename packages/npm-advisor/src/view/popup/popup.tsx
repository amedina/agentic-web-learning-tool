import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { PackageSearch, XCircle } from "lucide-react";
import { type PackageStats } from "../../utils/stats";
import { Header } from "./components/Header";
import { LicenseCheck } from "./components/LicenseCheck";
import { Responsiveness } from "./components/Responsiveness";
import { BundleFootprint } from "./components/BundleFootprint";
import { SecurityAdvisories } from "./components/SecurityAdvisories";
import { Recommendations } from "./components/Recommendations";
import { DependencyTree } from "./components/DependencyTree";
import { GlobalHeader } from "./components/GlobalHeader";
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

export const Popup = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "ask_ai">("insights");

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

  // ---------------------------------------------------------------------- //
  //                                UI Render                                //
  // ---------------------------------------------------------------------- //
  if (loading) {
    return (
      <div className="flex flex-col w-[500px] h-[600px] bg-slate-50 antialiased">
        <GlobalHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-800">
          <div className="animate-spin text-blue-500 mb-4">
            <PackageSearch size={40} />
          </div>
          <p className="font-medium">Analyzing Package Data...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col w-[500px] h-[600px] bg-slate-50 antialiased">
        <GlobalHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-800 text-center">
          <XCircle size={40} className="text-red-500 mb-4" />
          <p className="font-semibold text-red-700">
            {error || "No stats found"}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Open a package page on npmjs.com or a package.json on GitHub.
          </p>
        </div>
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
    dependencyTree,
  } = stats;

  return (
    <div className="flex flex-col w-[500px] h-[600px] bg-slate-50 antialiased">
      <GlobalHeader />

      {/* Tabs Navigation */}
      <div className="flex items-center w-full bg-white border-b border-slate-200 relative">
        <button
          onClick={() => setActiveTab("insights")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "insights"
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Insights
        </button>
        <button
          onClick={() => setActiveTab("ask_ai")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "ask_ai"
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Ask AI
        </button>

        {/* Animated Indicator */}
        <div
          className="absolute bottom-0 h-[2px] bg-[#c94137] transition-all duration-300 ease-in-out"
          style={{
            width: "50%",
            left: activeTab === "insights" ? "0%" : "50%",
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto w-full relative">
        {activeTab === "insights" ? (
          <div className="text-slate-800 p-4 space-y-4">
            <Header
              packageName={packageName}
              githubUrl={githubUrl}
              stars={stars}
              collaboratorsCount={collaboratorsCount}
              lastCommitDate={lastCommitDate}
              license={license}
            />

            <div className="grid grid-cols-2 gap-4">
              <LicenseCheck licenseCompatibility={licenseCompatibility} />
              <Responsiveness responsiveness={responsiveness as any} />
            </div>

            <BundleFootprint bundle={bundle} />
            <SecurityAdvisories securityAdvisories={securityAdvisories} />
            <Recommendations recommendations={recommendations} />
            <DependencyTree dependencyTree={dependencyTree} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-slate-800 h-full animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold mb-2">Ask AI</h2>
            <p className="text-slate-500 text-center text-sm">
              Your AI assistant for {packageName} is coming soon!
            </p>
          </div>
        )}
      </div>
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
