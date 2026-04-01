/**
 * External dependencies.
 */
import React from "react";
import { Settings, Moon, Sun } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useTheme } from "../context/themeContext";

export const GlobalHeader = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  const openOptionsPage = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options/options.html"));
    }
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
