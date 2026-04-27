/**
 * External dependencies.
 */
import { toast } from "@google-awlt/design-system";

/**
 * Internal dependencies.
 */
import { GITHUB_RATE_LIMIT_ERROR_MARKER } from "../../../utils/githubFetch";

export const GITHUB_RATE_LIMIT_USER_MESSAGE =
  "GitHub API rate limit reached. Add a Personal Access Token in Options.";

// Module-scoped so the toast fires at most once per sidepanel session, no
// matter how many fetchers (main package, dependency tree) hit the limit.
let rateLimitToastShown = false;

export function showGithubRateLimitToastOnce() {
  if (rateLimitToastShown) {
    return;
  }
  rateLimitToastShown = true;
  toast.error(GITHUB_RATE_LIMIT_USER_MESSAGE, {
    duration: 10000,
    closeButton: true,
    action: {
      label: "Open Settings",
      onClick: () => {
        // Deep-links to the Settings tab of the Options page so the user
        // lands directly on the PAT input rather than the default Models tab.
        chrome.runtime.sendMessage({ type: "OPEN_OPTIONS_SETTINGS" });
      },
    },
  });
}

export function isGithubRateLimitError(message: string | undefined): boolean {
  return !!message && message.includes(GITHUB_RATE_LIMIT_ERROR_MARKER);
}

/**
 * Test-only escape hatch. Resets the once-per-session guard so unit tests
 * can verify the gating without needing a fresh module import each time.
 */
export function __resetGithubRateLimitToastForTests() {
  rateLimitToastShown = false;
}
