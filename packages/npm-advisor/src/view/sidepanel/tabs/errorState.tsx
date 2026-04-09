/**
 * External dependencies.
 */
import { XCircle, Info } from "lucide-react";

interface ErrorStateProps {
  error: string | null;
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

const openInCurrentTab = (url: string) => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
      chrome.tabs.update(tab.id, { url });
    }
  });
};

export const NavigationMessage: React.FC = () => (
  <div className="flex flex-col w-full h-full bg-slate-50 dark:bg-slate-900 antialiased">
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-200 text-center">
      <Info size={40} className="text-blue-400 mb-4" />
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
        package.json page to view stats.
      </p>
    </div>
  </div>
);
