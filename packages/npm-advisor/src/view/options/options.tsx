import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  BarChart2,
  Trash2,
  Award,
} from "lucide-react";
import "./options.css";

const calculateScore = (pkg: any) => {
  if (pkg.score !== undefined && pkg.score !== null) return pkg.score;
  let score = 0;
  const gzip = pkg.bundle?.gzip || Infinity;
  if (gzip < 50000) score += 10;
  if (gzip < 10000) score += 20;

  const deps = pkg.dependencyTree
    ? Object.keys(pkg.dependencyTree.dependencies || {}).length
    : 0;
  if (deps === 0) score += 30;
  else if (deps < 5) score += 15;

  const recs = pkg.recommendations;
  if (
    recs &&
    (recs.nativeReplacements?.length > 0 ||
      recs.preferredReplacements?.length > 0)
  ) {
    score += 25;
  }
  return score;
};

const Options = () => {
  const [activeTab, setActiveTab] = useState<"settings" | "comparison">(
    window.location.hash === "#comparison" ? "comparison" : "settings",
  );
  const [comparisonBucket, setComparisonBucket] = useState<any[]>([]);

  const [targetLicense, setTargetLicense] = useState("MIT");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [openAIApiKey, setOpenAIApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load existing settings
    chrome.storage.sync.get(
      ["targetLicense", "geminiApiKey", "openAIApiKey"],
      (result) => {
        if (result.targetLicense)
          setTargetLicense(result.targetLicense as string);
        if (result.geminiApiKey) setGeminiApiKey(result.geminiApiKey as string);
        if (result.openAIApiKey) setOpenAIApiKey(result.openAIApiKey as string);
      },
    );

    // Listen for hash changes if user clicks view comparison again
    const onHashChange = () => {
      if (window.location.hash === "#comparison") {
        setActiveTab("comparison");
      }
    };
    window.addEventListener("hashchange", onHashChange);

    // Load comparison bucket
    chrome.storage.local.get(["comparisonBucket"], (res) => {
      if (res.comparisonBucket) {
        setComparisonBucket(res.comparisonBucket as any[]);
      }
    });

    // Listen for storage changes if popup adds new items while options is open
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === "local" && changes.comparisonBucket) {
        setComparisonBucket((changes.comparisonBucket.newValue as any[]) || []);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    chrome.storage.sync.set(
      { targetLicense, geminiApiKey, openAIApiKey },
      () => {
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      },
    );
  };

  const handleClearComparison = () => {
    chrome.storage.local.set({ comparisonBucket: [] }, () => {
      setComparisonBucket([]);
    });
  };

  const calculateWinner = () => {
    if (comparisonBucket.length === 0) return null;
    let bestScore = -Infinity;
    let winner = null;

    comparisonBucket.forEach((pkg) => {
      const score = calculateScore(pkg);
      if (score > bestScore) {
        bestScore = score;
        winner = pkg.packageName;
      }
    });

    return winner;
  };

  const winnerName = calculateWinner();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Header & Tabs */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <img
                src={chrome.runtime.getURL("assets/icon.png")}
                className="w-8 h-8"
                alt="NPM Advisor Logo"
              />
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                NPM Advisor
              </h2>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "settings"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button
                onClick={() => setActiveTab("comparison")}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "comparison"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Compare ({comparisonBucket.length})
              </button>
            </div>
          </div>
        </div>

        {activeTab === "settings" && (
          <div className="mt-8 space-y-6 max-w-xl mx-auto">
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="targetLicense"
                  className="block text-sm font-medium leading-6 text-slate-900"
                >
                  Target Project License
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Used to determine if an NPM package's license is compatible
                  with your project. (e.g., MIT, GPL, Apache-2.0)
                </p>
                <div className="relative mt-2 rounded-md shadow-sm">
                  <input
                    type="text"
                    name="targetLicense"
                    id="targetLicense"
                    className="block w-full rounded-md border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm"
                    placeholder="e.g. MIT"
                    value={targetLicense}
                    onChange={(e) => setTargetLicense(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label
                  htmlFor="geminiApiKey"
                  className="block text-sm font-medium leading-6 text-slate-900"
                >
                  Google Gemini API Key
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Required to power the "Ask AI" Chatbot tab. Get yours from
                  Google AI Studio.
                </p>
                <div className="relative mt-2 rounded-md shadow-sm">
                  <input
                    type="password"
                    name="geminiApiKey"
                    id="geminiApiKey"
                    className="block w-full rounded-md border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm"
                    placeholder="AIzaSy..."
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <label
                  htmlFor="openAIApiKey"
                  className="block text-sm font-medium leading-6 text-slate-900"
                >
                  OpenAI API Key (Optional)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Alternative provider to use for the chatbot responses.
                </p>
                <div className="relative mt-2 rounded-md shadow-sm">
                  <input
                    type="password"
                    name="openAIApiKey"
                    id="openAIApiKey"
                    className="block w-full rounded-md border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm"
                    placeholder="sk-..."
                    value={openAIApiKey}
                    onChange={(e) => setOpenAIApiKey(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-colors"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {showSuccess ? (
                    <CheckCircle2
                      className="h-5 w-5 text-green-300"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save
                      className="h-5 w-5 text-blue-300 group-hover:text-blue-200 transition-colors"
                      aria-hidden="true"
                    />
                  )}
                </span>
                {isSaving
                  ? "Saving..."
                  : showSuccess
                    ? "Saved!"
                    : "Save Settings"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "comparison" && (
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
                            <span className="text-green-600 font-medium">
                              Yes
                            </span>
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
                            <span className="text-green-600 font-medium">
                              No
                            </span>
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
                          {
                            Object.keys(pkg.dependencyTree?.dependencies || {})
                              .length
                          }
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
                                  pkg.responsiveness.description ===
                                  "Needs Attention"
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
                            Open Issues:{" "}
                            {pkg.responsiveness?.openIssuesCount || 0}
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
                              <span className="text-green-600 font-medium">
                                None
                              </span>
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
                  <span className="font-bold">{winnerName}</span> emerged as the
                  most efficient choice in this comparison bucket.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>,
  );
}
