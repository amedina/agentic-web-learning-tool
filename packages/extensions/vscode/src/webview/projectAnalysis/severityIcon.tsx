/**
 * External dependencies.
 */
import { type FC } from "react";
import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { ProjectFinding } from "@agentic-web-labs/project-analyzer-core";

/**
 * Renders the severity-appropriate icon shown to the left of a finding.
 */
export const SeverityIcon: FC<{ severity: ProjectFinding["severity"] }> = ({
  severity,
}) => {
  switch (severity) {
    case "error":
      return (
        <AlertCircle
          size={14}
          className="text-red-600 dark:text-red-400 shrink-0 mt-0.5"
        />
      );
    case "warning":
      return (
        <AlertTriangle
          size={14}
          className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
        />
      );
    case "info":
      return (
        <Info
          size={14}
          className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
        />
      );
    case "hint":
    default:
      return (
        <Lightbulb
          size={14}
          className="text-slate-500 dark:text-slate-400 shrink-0 mt-0.5"
        />
      );
  }
};
