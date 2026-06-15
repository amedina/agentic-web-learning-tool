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
  /** True when the run surfaced any issue. */
  hasIssues: boolean;
  message: string;
}

/**
 * Formats a completed Project Health report into a one-line summary for
 * a VSCode notification. Pure and unit-tested.
 */
export function formatReportSummary(
  report: ProjectHealthReport,
): NotificationSummary {
  const { vulnerabilities, licenseIssueCount, packageCount } = report.totals;
  const hasIssues = vulnerabilities.total > 0 || licenseIssueCount > 0;

  if (!hasIssues) {
    return {
      hasIssues: false,
      message: `NPM Advisor: Project Health clean. No vulnerabilities or license issues across ${packageCount} package(s).`,
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
  return {
    hasIssues: true,
    message: `NPM Advisor: Project Health found ${parts.join(" and ")} across ${packageCount} package(s).`,
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
