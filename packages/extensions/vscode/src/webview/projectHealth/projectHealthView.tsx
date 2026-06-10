/**
 * External dependencies.
 */
import { useState, type FC } from "react";

/**
 * Internal dependencies.
 */
import { AggregateFixCallout } from "./aggregateFixCallout";
import { PackageHealthList } from "./packageHealthList";
import {
  ProjectAnalysisActionsProvider,
  type ProjectAnalysisActions,
} from "./projectAnalysisActionsContext";
import { ProjectHealthHeader } from "./projectHealthHeader";
import {
  ProjectHealthSubTabBar,
  type ProjectHealthSubTab,
} from "./projectHealthSubTabBar";
import { SuppressionProvider } from "./suppressionContext";
import { reportHasActionableFindings, type ListFilter } from "./helpers";
import type {
  MuteTarget,
  ProjectHealthReport,
  ProjectHealthScope,
  SuppressionEntry,
} from "../../projectHealth/types";

interface ProjectHealthViewProps {
  /** The latest report, or null before the first run. */
  report: ProjectHealthReport | null;
  /** The scope currently running, or null when idle. */
  runningScope: ProjectHealthScope | null;
  /** Start a run for the given scope. */
  onRun: (scope: ProjectHealthScope) => void;
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
 * Public entry point for the Project Health mode. A workspace-wide "fix
 * with AI" callout sits at the top, followed by a two-tab strip splitting
 * the fast dependency check ("Dependencies") from the slower publint +
 * circular + replacement pass ("Project Analysis"). Each sub-tab carries
 * its own run button, summary header, and package roll-up so a slow
 * project analysis never blocks the fast dependency check. The component
 * is purely presentational: all run / cancel / drill-in behavior is
 * delegated to the callbacks supplied by the host.
 */
export const ProjectHealthView: FC<ProjectHealthViewProps> = ({
  report,
  runningScope,
  onRun,
  onCancel,
  onOpenPackageJson,
  suppressions,
  onMute,
  onUnmute,
  projectAnalysisActions,
}) => {
  const [activeTab, setActiveTab] =
    useState<ProjectHealthSubTab>("dependencies");
  const [filter, setFilter] = useState<ListFilter>("all");

  const handleTabChange = (tab: ProjectHealthSubTab): void => {
    setActiveTab(tab);
    setFilter("all");
  };

  const isDependencies = activeTab === "dependencies";
  const isRunning =
    runningScope === "all" ||
    runningScope === (isDependencies ? "dependencies" : "project");
  const hasCompletedRun = isDependencies
    ? report !== null && report.fastPassCompletedAt !== null
    : report !== null && report.backfillCompletedAt !== null;
  const showList = !isRunning && hasCompletedRun && report !== null;
  const showCallout =
    report !== null && reportHasActionableFindings(report, suppressions);

  return (
    <SuppressionProvider value={{ suppressions, onMute, onUnmute }}>
      <ProjectAnalysisActionsProvider value={projectAnalysisActions}>
        <div className="flex flex-col gap-3 p-4">
          {showCallout && report ? (
            <AggregateFixCallout
              report={report}
              suppressions={suppressions}
              postCopyPrompt={projectAnalysisActions.postCopyPrompt}
              postSetupMcp={projectAnalysisActions.postSetupMcp}
            />
          ) : null}
          <ProjectHealthSubTabBar
            activeTab={activeTab}
            onChange={handleTabChange}
          />
          <ProjectHealthHeader
            scope={activeTab}
            report={report}
            isRunning={isRunning}
            hasCompletedRun={hasCompletedRun}
            onRun={() => onRun(activeTab)}
            onCancel={onCancel}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
          {showList ? (
            <PackageHealthList
              scope={activeTab}
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
