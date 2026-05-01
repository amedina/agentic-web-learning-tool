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

export interface NpmAdvisorSettings {
  targetLicense: string;
  unmaintainedThresholdDays: number;
  advisorySeverityFloor: AdvisorySeverity;
}

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
  };
}

export function isAtOrAboveFloor(
  severity: AdvisorySeverity,
  floor: AdvisorySeverity,
): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[floor];
}
