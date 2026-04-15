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
export function getNavigationMessage(urlString: string | null) {
  try {
    const url = new URL(urlString ?? "");
    const hostname = url.hostname;
    const pathname = url.pathname;

    const isNpm = hostname.endsWith("npmjs.com");
    const isGithub = hostname.endsWith("github.com");

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
          Please navigate to a package.json file page in a GitHub repository.
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

    return null;
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
}
