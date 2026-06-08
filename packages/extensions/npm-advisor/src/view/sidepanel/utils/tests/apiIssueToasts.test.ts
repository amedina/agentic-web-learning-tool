/**
 * External dependencies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "@agentic-web-labs/design-system";

/**
 * Internal dependencies.
 */
import {
  notifyApiIssues,
  showBundleUnavailableToastOnce,
  showGithubIssuesUnavailableToastOnce,
  __resetApiIssueToastsForTests,
  BUNDLE_UNAVAILABLE_MESSAGE,
  GITHUB_ISSUES_UNAVAILABLE_MESSAGE,
  ADVISORY_COVERAGE_DEGRADED_MESSAGE,
} from "../apiIssueToasts";
import { showGithubRateLimitToastOnce } from "../githubRateLimitToast";

vi.mock("@agentic-web-labs/design-system", () => ({
  toast: { warning: vi.fn(), error: vi.fn() },
}));

vi.mock("../githubRateLimitToast", () => ({
  showGithubRateLimitToastOnce: vi.fn(),
}));

describe("apiIssueToasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetApiIssueToastsForTests();
  });

  it("does nothing for null stats", () => {
    notifyApiIssues(null);
    expect(toast.warning).not.toHaveBeenCalled();
    expect(showGithubRateLimitToastOnce).not.toHaveBeenCalled();
  });

  it("warns once when the GitHub Search API is throttled", () => {
    notifyApiIssues({ githubIssuesUnavailable: true } as any);
    expect(toast.warning).toHaveBeenCalledWith(
      GITHUB_ISSUES_UNAVAILABLE_MESSAGE,
      expect.objectContaining({ closeButton: true }),
    );
  });

  it("warns once when bundlephobia is unavailable", () => {
    notifyApiIssues({ bundleUnavailable: true } as any);
    expect(toast.warning).toHaveBeenCalledWith(
      BUNDLE_UNAVAILABLE_MESSAGE,
      expect.objectContaining({ closeButton: true }),
    );
  });

  it("delegates the GitHub Core rate limit to the existing toast helper", () => {
    notifyApiIssues({ githubRateLimited: true } as any);
    expect(showGithubRateLimitToastOnce).toHaveBeenCalledTimes(1);
  });

  it("warns when advisory coverage is degraded", () => {
    notifyApiIssues({ advisoryCoverageDegraded: true } as any);
    expect(toast.warning).toHaveBeenCalledWith(
      ADVISORY_COVERAGE_DEGRADED_MESSAGE,
      expect.objectContaining({ closeButton: true }),
    );
  });

  it("suppresses the advisory-coverage toast when a rate limit already explains it", () => {
    notifyApiIssues({
      githubRateLimited: true,
      advisoryCoverageDegraded: true,
    } as any);
    expect(showGithubRateLimitToastOnce).toHaveBeenCalledTimes(1);
    // The rate-limit toast covers the cause; no redundant advisory toast.
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("raises every matching notification when several flags are set", () => {
    notifyApiIssues({
      githubRateLimited: true,
      githubIssuesUnavailable: true,
      bundleUnavailable: true,
    } as any);
    expect(showGithubRateLimitToastOnce).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledTimes(2);
  });

  it("deduplicates each soft toast across the session", () => {
    showBundleUnavailableToastOnce();
    showBundleUnavailableToastOnce();
    showGithubIssuesUnavailableToastOnce();
    showGithubIssuesUnavailableToastOnce();
    expect(toast.warning).toHaveBeenCalledTimes(2);
  });
});
