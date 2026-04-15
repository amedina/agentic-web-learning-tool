/**
 * External dependencies.
 */
import { XCircle, Info } from "lucide-react";

interface ErrorStateProps {
  error: string | null;
}

interface NavigationMessageProps {
  url: string | null;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => (
  <div className="flex flex-col w-full h-full bg-slate-50 dark:bg-slate-900 antialiased">
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-200 text-center">
      <XCircle size={40} className="text-red-500 mb-4" />
      <p className="font-semibold text-red-700 dark:text-red-400">
        {error || "No stats found"}
      </p>
    </div>
  </div>
);

export const NavigationMessage = ({ url }: NavigationMessageProps) => {
  const openInCurrentTab = (url: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.update(tab.id, { url });
      }
    });
  };

  /**
   * Generates a custom message based on the user's current URL.
   * @param {string} urlString - The current URL of the browser tab.
   * @returns {string|null} - The warning message, or null if the user is on a valid page.
   */
  const getNavigationMessage = (urlString: string | null) => {
    try {
      const url = new URL(urlString ?? "");
      const hostname = url.hostname;
      const pathname = url.pathname;

      const isNpm = hostname.endsWith("npmjs.com");
      const isGithub =
        hostname.endsWith("github.com") ||
        hostname.endsWith("githubusercontent.com");

      const isNpmPackagePage = isNpm && pathname.startsWith("/package/");
      const isGithubPackageJson = isGithub && pathname.endsWith("package.json");

      if (isNpm && !isNpmPackagePage) {
        return (
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            Please navigate to an npmjs package details page.
          </p>
        );
      }

      if (isGithub && !isGithubPackageJson) {
        return (
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            Please navigate to a package.json file page in this GitHub
            repository.
          </p>
        );
      }

      if (!isNpmPackagePage && !isGithubPackageJson) {
        return (
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            Navigate to an{" "}
            <button
              onClick={() => openInCurrentTab("https://www.npmjs.com/")}
              className="text-blue-500 hover:underline cursor-pointer"
            >
              npmjs.com
            </button>{" "}
            package or a{" "}
            <button
              onClick={() => openInCurrentTab("https://github.com/")}
              className="text-blue-500 hover:underline cursor-pointer"
            >
              github.com
            </button>{" "}
            package.json file to view stats.
          </p>
        );
      }

      return (
        <p className="font-semibold text-slate-600 dark:text-slate-300">
          Seems like you are on a valid package.json but its not a package.
        </p>
      );
    } catch (error) {
      return (
        <p className="font-semibold text-slate-600 dark:text-slate-300">
          Navigate to an{" "}
          <button
            onClick={() => openInCurrentTab("https://www.npmjs.com/")}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            npmjs.com
          </button>{" "}
          package or a{" "}
          <button
            onClick={() => openInCurrentTab("https://github.com/")}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            github.com
          </button>{" "}
          package.json file to view stats.
        </p>
      );
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 dark:bg-slate-900 antialiased">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-200 text-center">
        <Info size={40} className="text-blue-400 mb-4" />
        {getNavigationMessage(url)}
      </div>
    </div>
  );
};
