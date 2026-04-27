/**
 * External dependencies
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  OptionsPageTab,
  OptionsPageTabSection,
} from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import ThemeToggleSection from "./themeToggleSection";
import DataManagementSection from "./dataManagementSection";
import GithubAuthSection from "./githubAuthSection";
import ResetConfirmationDialog from "./resetConfirmationDialog";
import { toast } from "@google-awlt/design-system";

type ThemeMode = "light" | "dark" | "auto";

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function SettingsTab() {
  const [theme, setTheme] = useState<ThemeMode>("auto");
  const [targetLicense, setTargetLicense] = useState("MIT");
  const [useAlgoliaSearch, setUseAlgoliaSearch] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial values
  useEffect(() => {
    chrome.storage.local.get(
      ["npmAdvisorThemeMode", "useAlgoliaSearch"],
      (result) => {
        if (result.npmAdvisorThemeMode) {
          setTheme(result.npmAdvisorThemeMode as ThemeMode);
        }

        if (result.useAlgoliaSearch !== undefined) {
          setUseAlgoliaSearch(result.useAlgoliaSearch as boolean);
        }
      },
    );
    chrome.storage.sync.get(["targetLicense"], (result) => {
      if (result.targetLicense) {
        setTargetLicense(result.targetLicense as string);
      }
    });
  }, []);

  // Sync theme class when popup toggles dark mode externally
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === "local" && changes.npmAdvisorDarkMode !== undefined) {
        const isDark = !!changes.npmAdvisorDarkMode.newValue;
        if (isDark) {
          document.documentElement.classList.add("dark");
          // If popup toggled to dark while we had "light" selected, switch to "dark"
          setTheme((prev) => (prev === "light" ? "dark" : prev));
        } else {
          document.documentElement.classList.remove("dark");
          setTheme((prev) => (prev === "dark" ? "light" : prev));
        }
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    setTheme(newTheme);
    const isDark = resolveIsDark(newTheme);

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    chrome.storage.local.set({
      npmAdvisorThemeMode: newTheme,
      npmAdvisorDarkMode: isDark,
    });
  }, []);

  // Auto-save targetLicense with debounce
  const handleLicenseChange = useCallback((value: string) => {
    setTargetLicense(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      chrome.storage.sync.set({ targetLicense: value });
    }, 600);
  }, []);

  const handleFactoryReset = useCallback(async () => {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    document.documentElement.classList.remove("dark");
    toast.success("All data has been reset.");
    setTimeout(() => window.location.reload(), 1000);
  }, []);

  const onUseAlgoliaSearchChange = useCallback((value: boolean) => {
    setUseAlgoliaSearch(value);
    chrome.storage.local.set({ useAlgoliaSearch: value });

    chrome.tabs.query({ url: "https://www.npmjs.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id!);
      });
    });
  }, []);

  return (
    <OptionsPageTab
      title="Settings"
      description="Manage extension settings, customize themes, and handle data storage options."
    >
      <ThemeToggleSection theme={theme} onThemeChange={handleThemeChange} />

      <OptionsPageTabSection title="General">
        <div className="flex flex-col gap-6 max-w-sm">
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-text-primary">
              Target Project License
            </label>
            <p className="text-xs text-amethyst-haze">
              Used to determine if an NPM package's license is compatible with
              your project. (e.g., MIT, GPL, Apache-2.0)
            </p>
            <input
              type="text"
              value={targetLicense}
              onChange={(e) => handleLicenseChange(e.target.value)}
              placeholder="e.g. MIT"
              className="block w-full rounded-md border border-subtle-zinc bg-transparent py-2 px-3 text-sm text-accent-foreground placeholder:text-amethyst-haze focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-5 items-center">
              <input
                id="useAlgoliaSearch"
                type="checkbox"
                checked={useAlgoliaSearch}
                onChange={(e) => {
                  onUseAlgoliaSearchChange(e.target.checked);
                }}
                className="h-4 w-4 rounded border-subtle-zinc text-primary focus:ring-primary bg-transparent"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="useAlgoliaSearch"
                className="text-sm font-medium text-text-primary leading-none"
              >
                Enable Advanced Search Overlay
              </label>
              <p className="mt-1 text-xs text-amethyst-haze">
                Replaces the native npm search with a filter-aware experience
                (Mode: Author, Keyword).
              </p>
            </div>
          </div>
        </div>
      </OptionsPageTabSection>

      <GithubAuthSection />

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
