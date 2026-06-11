/**
 * External dependencies.
 */
import { toast } from "@agentic-web-labs/design-system";
import { GITHUB_RATE_LIMIT_ERROR_MARKER } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { GITHUB_PAT_STORAGE_KEY } from "../../../serviceWorker/services/githubAuth";

export const GITHUB_RATE_LIMIT_USER_MESSAGE =
  "GitHub API rate limit reached. Add a Personal Access Token in Options.";

export const GITHUB_RATE_LIMIT_WITH_PAT_MESSAGE =
  "GitHub API rate limit reached. Some signals may be missing right now; this usually clears within a few minutes.";

// Module-scoped so the toast fires at most once per sidepanel session, no
// matter how many fetchers (main package, dependency tree) hit the limit.
let rateLimitToastShown = false;

/**
 * Resolves with `true` if the user has saved a GitHub PAT. Stored in
 * `chrome.storage.local` as a non-empty string by `githubAuthService`.
 */
function hasGithubPat(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) {
      resolve(false);
      return;
    }
    chrome.storage.local.get([GITHUB_PAT_STORAGE_KEY], (result) => {
      const token = result?.[GITHUB_PAT_STORAGE_KEY];
      resolve(typeof token === "string" && token.length > 0);
    });
  });
}

export function showGithubRateLimitToastOnce() {
  if (rateLimitToastShown) {
    return;
  }
  // Reserve the slot synchronously so concurrent triggers don't all queue
  // their own PAT lookups. We will release it again if the toast is
  // suppressed because the user already has a PAT.
  rateLimitToastShown = true;

  void hasGithubPat().then((hasPat) => {
    if (hasPat) {
      // PAT is configured, so the "Add a PAT" action item doesn't apply.
      // Still inform the user why some signals are missing instead of leaving
      // them to guess — but with a softer warning toast and no action button,
      // since there's nothing for them to fix beyond waiting for the limit to
      // reset. The once-per-session guard stays set so this can't spam during
      // a multi-dependency scan.
      toast.warning(GITHUB_RATE_LIMIT_WITH_PAT_MESSAGE, {
        duration: 8000,
        closeButton: true,
      });
      return;
    }
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
