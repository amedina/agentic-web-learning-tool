/**
 * External dependencies.
 */
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { SHOW_PROJECT_HEALTH_DEPENDENCIES_COMMAND } from "../commands/showProjectHealth";
import type { ProjectHealthReport } from "./types";

/** Label of the notification action that reveals the panel. */
const SHOW_ACTION_LABEL = "Show Project Health";

/** Label of the notification action that disables the daily auto-run. */
const TURN_OFF_ACTION_LABEL = "Turn off daily checks";

/** A formatted notification summary for a completed run. */
export interface NotificationSummary {
  /** True when the run surfaced any active (non-suppressed) issue. */
  hasIssues: boolean;
  message: string;
}

/**
 * Formats a completed Project Health report into a one-line summary for
 * a VSCode notification. The headline counts are the number of affected
 * package.json files (`vulnerablePackageCount` / `licenseIssuePackageCount`),
 * matching the panel's vulnerability / license chips so the notification
 * and the panel agree. The parenthetical severity note stays finding-level
 * (distinct critical / high advisories), mirroring the panel's severity
 * breakdown. Suppressed findings are excluded and noted parenthetically.
 * Pure and unit-tested.
 */
export function formatReportSummary(
  report: ProjectHealthReport,
): NotificationSummary {
  const {
    vulnerabilities,
    vulnerablePackageCount,
    licenseIssuePackageCount,
    suppressedCount,
    packageCount,
  } = report.totals;
  const hasIssues = vulnerablePackageCount > 0 || licenseIssuePackageCount > 0;

  if (!hasIssues) {
    const suffix =
      suppressedCount > 0 ? ` (${suppressedCount} suppressed)` : "";
    return {
      hasIssues: false,
      message: `NPM Advisor: Project Health clean. No vulnerabilities or license issues across ${packageCount} package(s).${suffix}`,
    };
  }

  const parts: string[] = [];
  if (vulnerablePackageCount > 0) {
    const severityNote =
      vulnerabilities.critical > 0 || vulnerabilities.high > 0
        ? ` (${vulnerabilities.critical} critical, ${vulnerabilities.high} high)`
        : "";
    parts.push(
      `${vulnerablePackageCount} vulnerabilit${vulnerablePackageCount === 1 ? "y" : "ies"}${severityNote}`,
    );
  }
  if (licenseIssuePackageCount > 0) {
    parts.push(
      `${licenseIssuePackageCount} license issue${licenseIssuePackageCount === 1 ? "" : "s"}`,
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
 * Health" action reveals the npm-advisor panel and switches it to the
 * Project Health view's Dependencies sub-tab; "Turn off daily checks"
 * disables the daily auto-run (since this notification fires every day)
 * by writing `npmAdvisor.projectHealth.autoRun` to `off`. Fire-and-forget.
 */
export async function notifyReportSummary(
  report: ProjectHealthReport,
): Promise<void> {
  const summary = formatReportSummary(report);
  const choice = summary.hasIssues
    ? await vscode.window.showWarningMessage(
        summary.message,
        SHOW_ACTION_LABEL,
        TURN_OFF_ACTION_LABEL,
      )
    : await vscode.window.showInformationMessage(
        summary.message,
        SHOW_ACTION_LABEL,
        TURN_OFF_ACTION_LABEL,
      );
  if (choice === SHOW_ACTION_LABEL) {
    await vscode.commands.executeCommand(
      SHOW_PROJECT_HEALTH_DEPENDENCIES_COMMAND,
    );
  } else if (choice === TURN_OFF_ACTION_LABEL) {
    await vscode.workspace
      .getConfiguration("npmAdvisor")
      .update(
        "projectHealth.autoRun",
        "off",
        vscode.ConfigurationTarget.Global,
      );
    void vscode.window.showInformationMessage(
      "NPM Advisor: Daily dependency checks turned off. Re-enable them from Project Health > Dependencies.",
    );
  }
}
