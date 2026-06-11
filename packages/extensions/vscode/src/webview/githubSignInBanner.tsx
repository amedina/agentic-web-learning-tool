/**
 * External dependencies.
 */
import { type FC } from "react";
import { Github } from "lucide-react";

interface GithubSignInBannerProps {
  /**
   * `signedOut`: no GitHub account in VSCode, offer sign-in.
   * `needsAuthorization`: a GitHub account exists but NPM Advisor has not
   * been authorized to use it, offer authorizing.
   */
  status: "signedOut" | "needsAuthorization";
  onSignIn: () => void;
}

/**
 * Small banner shown at the top of the side panel when GitHub requests
 * fall back to the anonymous rate limit, either because the user is not
 * signed in to GitHub or because NPM Advisor has not been authorized to
 * use an existing GitHub session. Offers a one-click action that lifts
 * the limit, with copy tailored to which case applies.
 */
export const GithubSignInBanner: FC<GithubSignInBannerProps> = ({
  status,
  onSignIn,
}) => {
  const needsAuthorization = status === "needsAuthorization";
  const message = needsAuthorization
    ? "You're signed in to GitHub, but NPM Advisor isn't authorized to use your session, so requests fall back to the anonymous limit of 60 per hour. Authorize NPM Advisor to raise the limit to 5,000 per hour."
    : "You're not signed in to GitHub. Anonymous requests are capped at 60 per hour, so some package data (stars, last commit, security advisories) may be missing or slow. Sign in to raise the limit to 5,000 per hour.";
  const buttonLabel = needsAuthorization
    ? "Authorize NPM Advisor"
    : "Sign in to GitHub";
  return (
    <div className="flex items-start gap-2 border-b border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
      <Github size={14} className="mt-0.5 shrink-0" />
      <div className="flex flex-col items-start gap-1.5">
        <span>{message}</span>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded bg-sky-500 px-2 py-1 font-medium text-white hover:bg-sky-600"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};
