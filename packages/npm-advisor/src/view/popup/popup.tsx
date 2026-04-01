/**
 * External dependencies.
 */
import React, { useState, useEffect, useMemo } from "react";
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
import { ThemeProvider } from "./context/themeContext";

import "./popup.css";

export const Popup = () => {
  const [activeTab, setActiveTab] = useState<"insights" | "ask_ai">("insights");
  const {
    stats,
    loading,
    error,
    isAddedToCompare,
    handleAddToCompare,
    handleAddRecommendationToCompare,
    comparisonBucketNames,
    addingRecommendations,
  } = usePackageStats();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [disableLock, setDisableLock] = useState(false);

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
    chrome.storage.local.onChanged.addListener(() => {
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
    });

    return () => {
      chrome.storage.local.onChanged.removeListener(() => {
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
      });
    };
  }, []);

  const renderContent = useMemo(() => {
    if (loading) {
      return <LoadingState />;
    }

    if (error || !stats) {
      return <ErrorState error={error} />;
    }

    if (activeTab === "insights") {
      return (
        <InsightsTab
          stats={stats}
          onAddToCompare={handleAddToCompare}
          isAddedToCompare={isAddedToCompare}
          onAddRecommendationToCompare={handleAddRecommendationToCompare}
          comparisonBucketNames={comparisonBucketNames}
          addingRecommendations={addingRecommendations}
        />
      );
    }

    if (activeTab === "ask_ai") {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-slate-800 h-full w-full animate-in fade-in duration-300">
          <AskAI
            packageName={stats.packageName}
            stats={stats}
            messages={messages}
            setDisableLock={setDisableLock}
          />
        </div>
      );
    }
  }, [
    loading,
    stats,
    error,
    handleAddToCompare,
    handleAddRecommendationToCompare,
    comparisonBucketNames,
    addingRecommendations,
    isAddedToCompare,
    activeTab,
    messages,
  ]);

  if (error || (!loading && !stats)) return <ErrorState error={error} />;

  return (
    <ThemeProvider>
      <div className="flex flex-col w-[500px] h-[600px] bg-slate-50 dark:bg-slate-900 antialiased">
        <GlobalHeader />

        {/* Tabs Navigation */}
        <div className="flex items-center w-full bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 relative">
          <button
            onClick={() => setActiveTab("insights")}
            disabled={disableLock}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "insights"
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            } disabled:cursor-default disabled:opacity-50`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab("ask_ai")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "ask_ai"
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
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
          {renderContent}
        </div>
      </div>
    </ThemeProvider>
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
