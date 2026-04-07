/**
 * External dependencies.
 */
import React, { useState, useEffect } from "react";
import { Settings, Moon, Sun, GitCompareArrows } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useTheme } from "../context/themeContext";

export const GlobalHeader = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [comparisonCount, setComparisonCount] = useState(0);

  useEffect(() => {
    chrome.storage.local.get(["comparisonBucket"], (res) => {
      setComparisonCount((res.comparisonBucket ?? []).length);
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      if ("comparisonBucket" in changes) {
        setComparisonCount((changes.comparisonBucket.newValue ?? []).length);
      }
    };
    chrome.storage.local.onChanged.addListener(listener);
    return () => chrome.storage.local.onChanged.removeListener(listener);
  }, []);

  const openOptionsPage = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options/options.html"));
    }
  };

  const openComparisons = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("options/options.html#comparison"),
    });
  };

  return (
    <div className="flex items-center justify-end w-full px-3 py-1.5 border-b bg-background">
      <div className="flex items-center gap-1">
        {comparisonCount > 0 && (
          <button
            onClick={openComparisons}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-xs font-medium px-2 py-1 rounded hover:bg-accent"
            title="View comparisons"
          >
            <GitCompareArrows size={14} />
            <span>View Comparisons</span>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#c94137]/15 text-[#c94137] text-[10px] font-bold leading-none">
              {comparisonCount}
            </span>
          </button>
        )}

        <button
          onClick={openOptionsPage}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings size={15} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </div>
  );
};
