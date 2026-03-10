import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Settings, Save, CheckCircle2 } from "lucide-react";
import "./options.css";

const Options = () => {
  const [targetLicense, setTargetLicense] = useState("MIT");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load existing settings
    chrome.storage.sync.get(["targetLicense"], (result) => {
      if (result.targetLicense) {
        setTargetLicense(result.targetLicense);
      }
    });
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    chrome.storage.sync.set({ targetLicense }, () => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Settings
            </h2>
          </div>
          <p className="text-center text-sm text-slate-500">
            Configure your NPM Advisor preferences
          </p>
        </div>

        <div className="mt-8 space-y-6">
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
                  className="block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="e.g. MIT"
                  value={targetLicense}
                  onChange={(e) => setTargetLicense(e.target.value)}
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
