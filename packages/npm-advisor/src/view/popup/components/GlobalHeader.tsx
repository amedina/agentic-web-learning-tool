/**
 * External dependencies.
 */
import React from "react";
import { Settings, Moon } from "lucide-react";

export const GlobalHeader = () => {
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
          src="/assets/icon.png"
          alt="NPM Advisor Logo"
          className="w-8 h-8 rounded shrink-0 object-contain shadow-sm bg-white p-1"
        />
        <h1 className="text-[17px] font-semibold tracking-tight">
          NPM Advisor
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Placeholder toggle for Theme */}
        <div
          className="w-8 h-4 bg-white/20 rounded-full cursor-pointer relative hidden"
          title="Theme Toggle (Coming Soon)"
        >
          <div className="w-4 h-4 bg-white rounded-full absolute left-0 top-0 shadow transition-transform"></div>
        </div>

        <button
          onClick={openOptionsPage}
          className="text-white hover:text-slate-200 transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        <button
          className="text-white hover:text-slate-200 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          <Moon size={16} />
        </button>
      </div>
    </div>
  );
};
