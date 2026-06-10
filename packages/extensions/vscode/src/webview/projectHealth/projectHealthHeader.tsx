/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import { EmptyHeader } from "./emptyHeader";
import { RunningHeader } from "./runningHeader";
import { SummaryHeader } from "./summaryHeader";
import type { ListFilter } from "./helpers";
import {
  isTerminalPhase,
  type ProjectHealthReport,
} from "../../projectHealth/types";

interface ProjectHealthHeaderProps {
  report: ProjectHealthReport | null;
  isRunning: boolean;
  onRun: () => void;
  onCancel: () => void;
  activeFilter: ListFilter;
  onFilterChange: (filter: ListFilter) => void;
}

/**
 * Header for the Project Health view. Renders one of three states: an
 * empty call-to-action before the first run, a determinate progress bar
 * with a cancel button while a run is in flight, or a summary chip row
 * (whose chips double as roll-up filters) with a re-run button once a
 * terminal report exists.
 */
export const ProjectHealthHeader: FC<ProjectHealthHeaderProps> = ({
  report,
  isRunning,
  onRun,
  onCancel,
  activeFilter,
  onFilterChange,
}) => {
  if (isRunning) {
    return <RunningHeader report={report} onCancel={onCancel} />;
  }

  const hasTerminalReport = report !== null && isTerminalPhase(report.phase);
  if (!hasTerminalReport) {
    return <EmptyHeader onRun={onRun} />;
  }

  return (
    <SummaryHeader
      report={report}
      onRun={onRun}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
    />
  );
};
