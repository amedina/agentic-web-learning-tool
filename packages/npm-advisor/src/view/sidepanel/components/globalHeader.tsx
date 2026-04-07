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
    <div className="flex items-center justify-between w-full px-4 pt-[10px] pb-[10px] bg-[#c94137] text-white">
      <div className="flex items-center space-x-3">
        <img
          src="/icons/icon.png"
          alt="NPM Advisor Logo"
          className="w-8 h-8 rounded shrink-0 object-contain shadow-sm bg-white p-1"
        />
        <h1 className="text-[17px] font-semibold tracking-tight">
          NPM Advisor
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {comparisonCount > 0 && (
          <button
            onClick={openComparisons}
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors cursor-pointer text-xs font-medium"
            title="View comparisons"
          >
            <GitCompareArrows size={14} />
            <span>View Comparisons</span>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-white text-[10px] font-bold leading-none">
              {comparisonCount}
            </span>
          </button>
        )}

        <button
          onClick={openOptionsPage}
          className="text-white hover:text-slate-200 transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        <button
          onClick={toggleTheme}
          className="text-white hover:text-slate-200 transition-colors cursor-pointer"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );
};
