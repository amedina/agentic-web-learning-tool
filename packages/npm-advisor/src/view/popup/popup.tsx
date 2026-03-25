/**
 * External dependencies.
 */
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import type { UIMessage } from "ai";

/**
 * Internal dependencies.
 */
import {
  GlobalHeader,
  AskAI,
  ErrorBoundary,
  LoadingState,
  ErrorState,
  InsightsTab,
} from "./components";
import { usePackageStats } from "./hooks/usePackageStats";

import "./popup.css";

export const Popup = () => {
  const [activeTab, setActiveTab] = useState<"insights" | "ask_ai">("insights");
  const { stats, loading, error, isAddedToCompare, handleAddToCompare } =
    usePackageStats();
  const [messages, setMessages] = useState<UIMessage[]>([]);

  useEffect(() => {
    chrome.storage.local.get(
      ["messages"],
      async (res: { messages?: Record<string, UIMessage[]> }) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const currentTab = tabs[0];
          if (currentTab?.id && res.messages) {
            setMessages(res.messages[currentTab.id] || []);
          }
        });
      },
    );
  }, []);

  if (loading) return <LoadingState />;
  if (error || !stats) return <ErrorState error={error} />;

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
          <InsightsTab
            stats={stats}
            onAddToCompare={handleAddToCompare}
            isAddedToCompare={isAddedToCompare}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-slate-800 h-full w-full animate-in fade-in duration-300">
            <AskAI
              packageName={stats.packageName}
              stats={stats}
              messages={messages}
            />
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
      <ErrorBoundary>
        <Popup />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
