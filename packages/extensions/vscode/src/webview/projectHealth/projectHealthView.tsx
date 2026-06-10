/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import { PackageHealthList } from "./packageHealthList";
import { ProjectHealthHeader } from "./projectHealthHeader";
import {
  isTerminalPhase,
  type ProjectHealthReport,
} from "../../projectHealth/types";

interface ProjectHealthViewProps {
  /** The latest report, or null before the first run. */
  report: ProjectHealthReport | null;
  /** True while a run is in flight. */
  isRunning: boolean;
  /** Start a full workspace analysis. */
  onRun: () => void;
  /** Cancel the in-flight run. */
  onCancel: () => void;
  /** Drill into a manifest by its `vscode.Uri.toString()`. */
  onOpenPackageJson: (uri: string) => void;
}

/**
 * Public entry point for the Project Health mode. Renders the summary
 * header (empty / running / terminal) and, once a report exists, the
 * sorted roll-up of every package.json's vulnerabilities, license
 * issues, and project-level analysis. The component is purely
 * presentational: all run/cancel/drill-in behavior is delegated to the
 * callbacks supplied by the host.
 */
export const ProjectHealthView: FC<ProjectHealthViewProps> = ({
  report,
  isRunning,
  onRun,
  onCancel,
  onOpenPackageJson,
}) => {
  const showList =
    report !== null && isTerminalPhase(report.phase) && !isRunning;

  return (
    <div className="flex flex-col gap-3 p-4">
      <ProjectHealthHeader
        report={report}
        isRunning={isRunning}
        onRun={onRun}
        onCancel={onCancel}
      />
      {showList ? (
        <PackageHealthList
          packages={report.packages}
          onOpenPackageJson={onOpenPackageJson}
        />
      ) : null}
    </div>
  );
};
