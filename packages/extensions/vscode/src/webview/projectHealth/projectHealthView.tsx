/**
 * External dependencies.
 */
import { useState, type FC } from "react";

/**
 * Internal dependencies.
 */
import { PackageHealthList } from "./packageHealthList";
import {
  ProjectAnalysisActionsProvider,
  type ProjectAnalysisActions,
} from "./projectAnalysisActionsContext";
import { ProjectHealthHeader } from "./projectHealthHeader";
import { SuppressionProvider } from "./suppressionContext";
import type { ListFilter } from "./helpers";
import {
  isTerminalPhase,
  type MuteTarget,
  type ProjectHealthReport,
  type SuppressionEntry,
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
  /** The persisted mutes for this workspace. */
  suppressions: SuppressionEntry[];
  /** Mute a finding, optionally recording why it was accepted. */
  onMute: (target: MuteTarget, reason?: string) => void;
  /** Remove an existing mute so the finding is shown again. */
  onUnmute: (target: MuteTarget) => void;
  /** Callbacks for the per-package project analysis embedded in each row. */
  projectAnalysisActions: ProjectAnalysisActions;
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
  suppressions,
  onMute,
  onUnmute,
  projectAnalysisActions,
}) => {
  const [filter, setFilter] = useState<ListFilter>("all");
  const showList =
    report !== null && isTerminalPhase(report.phase) && !isRunning;

  return (
    <SuppressionProvider value={{ suppressions, onMute, onUnmute }}>
      <ProjectAnalysisActionsProvider value={projectAnalysisActions}>
        <div className="flex flex-col gap-3 p-4">
          <ProjectHealthHeader
            report={report}
            isRunning={isRunning}
            onRun={onRun}
            onCancel={onCancel}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
          {showList ? (
            <PackageHealthList
              packages={report.packages}
              filter={filter}
              onClearFilter={() => setFilter("all")}
              onOpenPackageJson={onOpenPackageJson}
            />
          ) : null}
        </div>
      </ProjectAnalysisActionsProvider>
    </SuppressionProvider>
  );
};
