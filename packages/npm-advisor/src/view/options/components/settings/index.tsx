/**
 * External dependencies
 */
import { useState, useEffect, useCallback } from "react";
import {
  OptionsPageTab,
  OptionsPageTabSection,
  Button,
  toast,
} from "@google-awlt/design-system";
import { Save } from "lucide-react";

/**
 * Internal dependencies
 */
import ThemeToggleSection from "./themeToggleSection";
import DataManagementSection from "./dataManagementSection";
import ResetConfirmationDialog from "./resetConfirmationDialog";

type ThemeMode = "light" | "dark" | "auto";

export default function SettingsTab() {
  const [theme, setTheme] = useState<ThemeMode>("auto");
  const [targetLicense, setTargetLicense] = useState("MIT");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(
      ["npmAdvisorSettings", "targetLicense"],
      (result) => {
        if (result.npmAdvisorSettings?.theme) {
          setTheme(result.npmAdvisorSettings.theme as ThemeMode);
        }
        if (result.targetLicense) {
          setTargetLicense(result.targetLicense as string);
        }
      },
    );
  }, []);

  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    setTheme(newTheme);
    chrome.storage.sync.get(["npmAdvisorSettings"], (result) => {
      chrome.storage.sync.set({
        npmAdvisorSettings: {
          ...(result.npmAdvisorSettings ?? {}),
          theme: newTheme,
        },
      });
    });
  }, []);

  const handleSaveGeneral = useCallback(() => {
    setIsSaving(true);
    chrome.storage.sync.set({ targetLicense }, () => {
      setIsSaving(false);
      toast.success("Settings saved.");
    });
  }, [targetLicense]);

  const handleFactoryReset = useCallback(async () => {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    toast.success("All data has been reset.");
    setTimeout(() => window.location.reload(), 1000);
  }, []);

  return (
    <OptionsPageTab
      title="Settings"
      description="Manage extension settings, customize themes, and handle data storage options."
    >
      <ThemeToggleSection theme={theme} onThemeChange={handleThemeChange} />

      <OptionsPageTabSection title="General">
        <div className="flex flex-col gap-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Target Project License
            </label>
            <p className="text-xs text-amethyst-haze mb-2">
              Used to determine if an NPM package's license is compatible with
              your project. (e.g., MIT, GPL, Apache-2.0)
            </p>
            <input
              type="text"
              value={targetLicense}
              onChange={(e) => setTargetLicense(e.target.value)}
              placeholder="e.g. MIT"
              className="block w-full rounded-md border border-subtle-zinc bg-transparent py-2 px-3 text-sm text-accent-foreground placeholder:text-amethyst-haze focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            onClick={handleSaveGeneral}
            disabled={isSaving}
            className="w-fit flex items-center gap-2"
          >
            <Save size={14} />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </OptionsPageTabSection>

      <DataManagementSection setIsResetModalOpen={setIsResetModalOpen} />

      {isResetModalOpen && (
        <ResetConfirmationDialog
          setIsResetModalOpen={setIsResetModalOpen}
          onConfirm={handleFactoryReset}
        />
      )}
    </OptionsPageTab>
  );
}
