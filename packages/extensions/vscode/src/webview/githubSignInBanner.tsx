/**
 * External dependencies.
 */
import { type FC } from "react";
import { Github } from "lucide-react";

interface GithubSignInBannerProps {
  onSignIn: () => void;
}

/**
 * Small banner shown at the top of the side panel when the user is not
 * signed in to GitHub. Explains that anonymous requests are rate limited
 * and offers a one-click sign-in that lifts the limit.
 */
export const GithubSignInBanner: FC<GithubSignInBannerProps> = ({
  onSignIn,
}) => {
  return (
    <div className="flex items-start gap-2 border-b border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
      <Github size={14} className="mt-0.5 shrink-0" />
      <div className="flex flex-col items-start gap-1.5">
        <span>
          You're not signed in to GitHub. Anonymous requests are capped at 60
          per hour, so some package data (stars, last commit, security
          advisories) may be missing or slow. Sign in to raise the limit to
          5,000 per hour.
        </span>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded bg-sky-500 px-2 py-1 font-medium text-white hover:bg-sky-600"
        >
          Sign in to GitHub
        </button>
      </div>
    </div>
  );
};
