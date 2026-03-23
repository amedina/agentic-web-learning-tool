/**
 * External dependencies.
 */
import React from "react";
import { Save, CheckCircle2 } from "lucide-react";

interface SettingsTabProps {
  targetLicense: string;
  setTargetLicense: (val: string) => void;
  geminiApiKey: string;
  setGeminiApiKey: (val: string) => void;
  openAIApiKey: string;
  setOpenAIApiKey: (val: string) => void;
  handleSave: () => void;
  isSaving: boolean;
  showSuccess: boolean;
}

/**
 * Settings Tab.
 */
export const SettingsTab: React.FC<SettingsTabProps> = ({
  targetLicense,
  setTargetLicense,
  geminiApiKey,
  setGeminiApiKey,
  openAIApiKey,
  setOpenAIApiKey,
  handleSave,
  isSaving,
  showSuccess,
}) => {
  return (
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
            Used to determine if an NPM package's license is compatible with
            your project. (e.g., MIT, GPL, Apache-2.0)
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
            Required to power the "Ask AI" Chatbot tab. Get yours from Google AI
            Studio.
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
          {isSaving ? "Saving..." : showSuccess ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
};
