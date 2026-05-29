/**
 * External dependencies.
 */
import React from "react";
import { AlertCircle } from "lucide-react";

const GITHUB_RATE_LIMIT_TITLE =
  "Couldn't fetch — GitHub API rate limit reached. Add a Personal Access Token in Options.";

/**
 * Renders "N/A" with a warning icon and tooltip, shown when a GitHub API
 * rate-limit prevented stars / last-commit from loading.
 */
export const RateLimitedValue: React.FC = () => (
  <span
    className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"
    title={GITHUB_RATE_LIMIT_TITLE}
  >
    <AlertCircle size={12} />
    N/A
  </span>
);
