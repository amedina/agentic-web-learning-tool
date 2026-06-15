/**
 * External dependencies.
 */
import { useMemo, useState, type FC } from "react";

/**
 * Internal dependencies.
 */
import { AggregateFixCallout } from "./aggregateFixCallout";
import { AutoRunToggle } from "./autoRunToggle";
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
import { SeverityFilterToggle } from "./severityFilterToggle";
import { SuppressionProvider } from "./suppressionContext";
import { reportHasActionableFindings, type ListFilter } from "./helpers";
import { filterReportBySeverityFloor } from "../../projectHealth/projectHealthReport";
import { buildSuppressionPredicates } from "../../projectHealth/suppressionMatching";
import type {
  AdvisorySeverityFloor,
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
  /** True when the daily dependency auto-run is enabled. */
  autoRunDaily: boolean;
  /** Enable or disable the daily dependency auto-run. */
  onSetAutoRunDaily: (enabled: boolean) => void;
  /**
   * The configured `npmAdvisor.advisorySeverityFloor`. The Dependencies tab
   * hides advisories below it by default until the user shows all severities.
   */
  advisorySeverityFloor: AdvisorySeverityFloor;
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
  autoRunDaily,
  onSetAutoRunDaily,
  advisorySeverityFloor,
  projectAnalysisActions,
}) => {
  const [activeTab, setActiveTab] =
    useState<ProjectHealthSubTab>("dependencies");
  const [filter, setFilter] = useState<ListFilter>("all");
  const [showAllSeverities, setShowAllSeverities] = useState(false);

  const handleTabChange = (tab: ProjectHealthSubTab): void => {
    setActiveTab(tab);
    setFilter("all");
  };

  const isDependencies = activeTab === "dependencies";

  // Narrow the report to the configured severity floor on the Dependencies
  // tab. Computed once and reused for the header, callout, and list so every
  // count stays consistent with the rendered rows. The Project Analysis tab
  // keeps the full report so its issue-count sort is never perturbed.
  const filteredReport = useMemo(() => {
    if (report === null || !isDependencies) {
      return report;
    }
    return filterReportBySeverityFloor(
      report,
      advisorySeverityFloor,
      buildSuppressionPredicates(suppressions),
    );
  }, [report, isDependencies, advisorySeverityFloor, suppressions]);

  const visibleReport = showAllSeverities ? report : filteredReport;

  // Active vulnerabilities hidden by the floor, used to label the toggle.
  const hiddenVulnerabilityCount =
    report !== null && filteredReport !== null
      ? report.totals.vulnerabilities.total -
        filteredReport.totals.vulnerabilities.total
      : 0;

  const isRunning =
    runningScope === "all" ||
    runningScope === (isDependencies ? "dependencies" : "project");
  const hasCompletedRun = isDependencies
    ? report !== null && report.fastPassCompletedAt !== null
    : report !== null && report.backfillCompletedAt !== null;
  const showList = !isRunning && hasCompletedRun && report !== null;
  const showCallout =
    showList &&
    visibleReport !== null &&
    reportHasActionableFindings(visibleReport, suppressions, activeTab);
  const showSeverityToggle =
    showList &&
    isDependencies &&
    report !== null &&
    report.totals.vulnerabilities.total > 0;

  return (
    <SuppressionProvider value={{ suppressions, onMute, onUnmute }}>
      <ProjectAnalysisActionsProvider value={projectAnalysisActions}>
        <div className="flex flex-col gap-3 p-4">
          <ProjectHealthSubTabBar
            activeTab={activeTab}
            onChange={handleTabChange}
          />
          {isDependencies ? (
            <AutoRunToggle
              enabled={autoRunDaily}
              onChange={onSetAutoRunDaily}
            />
          ) : null}
          <ProjectHealthHeader
            scope={activeTab}
            report={visibleReport}
            isRunning={isRunning}
            hasCompletedRun={hasCompletedRun}
            onRun={() => onRun(activeTab)}
            onCancel={onCancel}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
          {showSeverityToggle ? (
            <SeverityFilterToggle
              showAll={showAllSeverities}
              floor={advisorySeverityFloor}
              hiddenCount={hiddenVulnerabilityCount}
              onChange={setShowAllSeverities}
            />
          ) : null}
          {showCallout && visibleReport ? (
            <AggregateFixCallout
              scope={activeTab}
              report={visibleReport}
              suppressions={suppressions}
              postCopyPrompt={projectAnalysisActions.postCopyPrompt}
              postSetupMcp={projectAnalysisActions.postSetupMcp}
            />
          ) : null}
          {showList && visibleReport ? (
            <PackageHealthList
              scope={activeTab}
              packages={visibleReport.packages}
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
