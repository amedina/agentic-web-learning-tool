/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { WEBVIEW_VIEW_ID } from "../providers/webviewViewProvider";
import type { ProjectHealthReport } from "./types";

/** Label of the notification action that reveals the panel. */
const SHOW_ACTION_LABEL = "Show Project Health";

/** A formatted notification summary for a completed run. */
export interface NotificationSummary {
  /** True when the run surfaced any active (non-suppressed) issue. */
  hasIssues: boolean;
  message: string;
}

/**
 * Formats a completed Project Health report into a one-line summary for
 * a VSCode notification. Counts reflect active (non-suppressed) issues;
 * suppressed findings are noted parenthetically. Pure and unit-tested.
 */
export function formatReportSummary(
  report: ProjectHealthReport,
): NotificationSummary {
  const { vulnerabilities, licenseIssueCount, suppressedCount, packageCount } =
    report.totals;
  const hasIssues = vulnerabilities.total > 0 || licenseIssueCount > 0;

  if (!hasIssues) {
    const suffix =
      suppressedCount > 0 ? ` (${suppressedCount} suppressed)` : "";
    return {
      hasIssues: false,
      message: `NPM Advisor: Project Health clean. No vulnerabilities or license issues across ${packageCount} package(s).${suffix}`,
    };
  }

  const parts: string[] = [];
  if (vulnerabilities.total > 0) {
    const severityNote =
      vulnerabilities.critical > 0 || vulnerabilities.high > 0
        ? ` (${vulnerabilities.critical} critical, ${vulnerabilities.high} high)`
        : "";
    parts.push(
      `${vulnerabilities.total} vulnerabilit${vulnerabilities.total === 1 ? "y" : "ies"}${severityNote}`,
    );
  }
  if (licenseIssueCount > 0) {
    parts.push(
      `${licenseIssueCount} license issue${licenseIssueCount === 1 ? "" : "s"}`,
    );
  }
  const suppressedNote =
    suppressedCount > 0 ? ` (${suppressedCount} suppressed)` : "";
  return {
    hasIssues: true,
    message: `NPM Advisor: Project Health found ${parts.join(" and ")} across ${packageCount} package(s).${suppressedNote}`,
  };
}

/**
 * Shows the report summary as a VSCode notification. Issues surface as a
 * warning, a clean run as an information message. The "Show Project
 * Health" action reveals the npm-advisor panel. Fire-and-forget.
 */
export async function notifyReportSummary(
  report: ProjectHealthReport,
): Promise<void> {
  const summary = formatReportSummary(report);
  const choice = summary.hasIssues
    ? await vscode.window.showWarningMessage(summary.message, SHOW_ACTION_LABEL)
    : await vscode.window.showInformationMessage(
        summary.message,
        SHOW_ACTION_LABEL,
      );
  if (choice === SHOW_ACTION_LABEL) {
    await vscode.commands.executeCommand(`${WEBVIEW_VIEW_ID}.focus`);
  }
}
