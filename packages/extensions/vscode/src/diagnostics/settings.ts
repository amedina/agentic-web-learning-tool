/**
 * External dependencies.
 */
import * as vscode from "vscode";

export type AdvisorySeverity = "critical" | "high" | "moderate" | "low";

const SEVERITY_RANK: Record<AdvisorySeverity, number> = {
  critical: 4,
  high: 3,
  moderate: 2,
  low: 1,
};

/** Whether to run the workspace-wide Project Health analysis on a schedule. */
export type ProjectHealthAutoRun = "off" | "daily";

export interface NpmAdvisorSettings {
  targetLicense: string;
  unmaintainedThresholdDays: number;
  advisorySeverityFloor: AdvisorySeverity;
  outdatedMajorThreshold: number;
  projectHealthAutoRun: ProjectHealthAutoRun;
}

/**
 * Reads the current npm-advisor settings from VSCode's workspace
 * configuration, applying defaults for any missing values. Called
 * fresh on every consumer that needs settings, so config changes take
 * effect on the next call without re-instantiating providers.
 */
export function readSettings(): NpmAdvisorSettings {
  const config = vscode.workspace.getConfiguration("npmAdvisor");
  return {
    targetLicense: config.get<string>("targetLicense", "MIT"),
    unmaintainedThresholdDays: config.get<number>(
      "unmaintainedThresholdDays",
      730,
    ),
    advisorySeverityFloor: config.get<AdvisorySeverity>(
      "advisorySeverityFloor",
      "high",
    ),
    outdatedMajorThreshold: config.get<number>("outdatedMajorThreshold", 2),
    projectHealthAutoRun: config.get<ProjectHealthAutoRun>(
      "projectHealth.autoRun",
      "off",
    ),
  };
}

/**
 * True when an advisory severity meets or exceeds the configured
 * floor. Used by the advisory rule to decide whether a given count
 * level (critical / high / moderate / low) should produce a
 * diagnostic.
 */
export function isAtOrAboveFloor(
  severity: AdvisorySeverity,
  floor: AdvisorySeverity,
): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[floor];
}
