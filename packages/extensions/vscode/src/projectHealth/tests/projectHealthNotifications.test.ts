/**
 * External dependencies.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";

/**
 * Internal dependencies.
 */
import { SHOW_PROJECT_HEALTH_DEPENDENCIES_COMMAND } from "../../commands/showProjectHealth";
import {
  formatReportSummary,
  notifyReportSummary,
} from "../projectHealthNotifications";
import { createInitialReport } from "../projectHealthReport";
import type { ProjectHealthReport, VulnerabilityTotals } from "../types";

/** Builds a completed report with the supplied totals. */
function report(totals: {
  vulnerabilities?: Partial<VulnerabilityTotals>;
  licenseIssueCount?: number;
  suppressedCount?: number;
  packageCount?: number;
}): ProjectHealthReport {
  const base = createInitialReport("ws", "ws", 1000);
  return {
    ...base,
    phase: "complete",
    totals: {
      packageCount: totals.packageCount ?? 3,
      uniqueDependencyCount: 10,
      vulnerabilities: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        unknown: 0,
        total: 0,
        ...totals.vulnerabilities,
      },
      licenseIssueCount: totals.licenseIssueCount ?? 0,
      replaceableCount: 0,
      suppressedCount: totals.suppressedCount ?? 0,
    },
  };
}

describe("formatReportSummary", () => {
  it("reports a clean run", () => {
    const summary = formatReportSummary(report({}));
    expect(summary.hasIssues).toBe(false);
    expect(summary.message).toContain("clean");
    expect(summary.message).toContain("3 package(s)");
  });

  it("summarizes vulnerabilities with a severity note", () => {
    const summary = formatReportSummary(
      report({
        vulnerabilities: { critical: 2, high: 1, total: 4 },
      }),
    );
    expect(summary.hasIssues).toBe(true);
    expect(summary.message).toContain("4 vulnerabilities");
    expect(summary.message).toContain("2 critical, 1 high");
  });

  it("summarizes license issues and notes suppressed findings", () => {
    const summary = formatReportSummary(
      report({ licenseIssueCount: 1, suppressedCount: 2 }),
    );
    expect(summary.hasIssues).toBe(true);
    expect(summary.message).toContain("1 license issue");
    expect(summary.message).toContain("(2 suppressed)");
  });
});

describe("notifyReportSummary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("navigates to Project Health > Dependencies when the show action is clicked on a report with issues", async () => {
    // The first action passed to the message is "Show Project Health";
    // returning it from the spy simulates the user clicking that button.
    vi.spyOn(vscode.window, "showWarningMessage").mockImplementation(
      (async (...args: unknown[]) => args[1]) as never,
    );
    const executeCommand = vi
      .spyOn(vscode.commands, "executeCommand")
      .mockResolvedValue(undefined);

    await notifyReportSummary(
      report({ vulnerabilities: { critical: 1, total: 1 } }),
    );

    expect(executeCommand).toHaveBeenCalledWith(
      SHOW_PROJECT_HEALTH_DEPENDENCIES_COMMAND,
    );
  });

  it("navigates to Project Health > Dependencies when the show action is clicked on a clean report", async () => {
    vi.spyOn(vscode.window, "showInformationMessage").mockImplementation(
      (async (...args: unknown[]) => args[1]) as never,
    );
    const executeCommand = vi
      .spyOn(vscode.commands, "executeCommand")
      .mockResolvedValue(undefined);

    await notifyReportSummary(report({}));

    expect(executeCommand).toHaveBeenCalledWith(
      SHOW_PROJECT_HEALTH_DEPENDENCIES_COMMAND,
    );
  });

  it("does nothing when the notification is dismissed", async () => {
    vi.spyOn(vscode.window, "showWarningMessage").mockResolvedValue(undefined);
    const executeCommand = vi
      .spyOn(vscode.commands, "executeCommand")
      .mockResolvedValue(undefined);

    await notifyReportSummary(
      report({ vulnerabilities: { critical: 1, total: 1 } }),
    );

    expect(executeCommand).not.toHaveBeenCalled();
  });
});
