/**
 * External dependencies.
 */
import React, { useEffect, useRef } from "react";
import { usePropProvider } from "@google-awlt/chatbot";

/**
 * Internal dependencies.
 */
import { SidepanelComparisonTable } from "./sidepanelComparisonTable";

export const ComparisonTab: React.FC = () => {
  const { setActiveTab } = usePropProvider(({ actions }) => ({
    setActiveTab: actions.setActiveTab,
  }));

  // Keep a stable ref so the storage listener always calls the latest setter
  const setActiveTabRef = useRef(setActiveTab);
  useEffect(() => {
    setActiveTabRef.current = setActiveTab;
  }, [setActiveTab]);

  useEffect(() => {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      if ("comparisonBucket" in changes) {
        const newBucket = (changes.comparisonBucket.newValue as any[]) ?? [];
        if (newBucket.length === 0) {
          setActiveTabRef.current("insights");
        }
      }
    };
    chrome.storage.local.onChanged.addListener(listener);
    return () => chrome.storage.local.onChanged.removeListener(listener);
  }, []);

  return (
    <div className="text-slate-800 dark:text-slate-200 p-4 h-full overflow-y-auto">
      <SidepanelComparisonTable />
    </div>
  );
};
