/**
 * External dependencies.
 */
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Settings as SettingsIcon, BarChart2 } from "lucide-react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import "./options.css";
/**
 * Internal dependencies.
 */
import { SettingsTab } from "./components/settingsTab";
import { ComparisonTab } from "./components/comparisonTab";
import { calculateScore } from "../../utils/calculateScore";
import { transportGenerator } from "../popup/runtime";
import { AssistantModal } from "./components/assistantModal";
import { getSystemPrompt } from "./components/getSystemPrompt";

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
  const [forceCloseModal, setForceCloseModal] = useState(false);

  const transport = useMemo(() => {
    if (geminiApiKey) {
      return transportGenerator(
        "gemini",
        "gemini-pro-latest",
        {
          apiKey: geminiApiKey,
        },
        getSystemPrompt(JSON.stringify(comparisonBucket, null, 2)),
      );
    }

    return transportGenerator(
      "open-ai",
      "gpt-4o",
      { apiKey: openAIApiKey },
      getSystemPrompt(JSON.stringify(comparisonBucket, null, 2)),
    );
  }, [geminiApiKey, openAIApiKey, comparisonBucket]);

  const runtime = useChatRuntime({
    messages: [],
    transport,
  });

  transport.setRuntime(runtime);

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
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          {/* Header & Tabs */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <img
                  src={chrome.runtime.getURL("icons/icon.png")}
                  className="w-8 h-8"
                  alt="NPM Advisor Logo"
                />
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  NPM Advisor
                </h2>
              </div>

              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => {
                    setActiveTab("settings");
                    setForceCloseModal(true);
                    // reset back to original state after changing tab
                    setTimeout(() => setForceCloseModal(false), 500);
                  }}
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
            <SettingsTab
              targetLicense={targetLicense}
              setTargetLicense={setTargetLicense}
              geminiApiKey={geminiApiKey}
              setGeminiApiKey={setGeminiApiKey}
              openAIApiKey={openAIApiKey}
              setOpenAIApiKey={setOpenAIApiKey}
              handleSave={handleSave}
              isSaving={isSaving}
              showSuccess={showSuccess}
            />
          )}

          {activeTab === "comparison" && (
            <ComparisonTab
              comparisonBucket={comparisonBucket}
              handleClearComparison={handleClearComparison}
              winnerName={winnerName}
            />
          )}
        </div>
      </div>
      <AssistantModal
        apiKeys={{
          gemini: geminiApiKey,
          openai: openAIApiKey,
        }}
        changeTabToSettings={() => setActiveTab("settings")}
        closeModal={forceCloseModal}
        activeTab={activeTab}
      />
    </AssistantRuntimeProvider>
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
