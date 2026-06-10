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
import type { ProjectHealthReport } from "../../projectHealth/types";

interface ProjectHealthHeaderProps {
  /** Which sub-tab this header drives (selects chips, copy, and run scope). */
  scope: "dependencies" | "project";
  report: ProjectHealthReport | null;
  /** True while this sub-tab's pass is in flight. */
  isRunning: boolean;
  /**
   * True when a finished report for this sub-tab's pass exists (the fast
   * pass for "dependencies", the backfill for "project"). Drives whether
   * the summary or the empty call-to-action is shown.
   */
  hasCompletedRun: boolean;
  /** Start the run for this sub-tab's scope. */
  onRun: () => void;
  onCancel: () => void;
  activeFilter: ListFilter;
  onFilterChange: (filter: ListFilter) => void;
}

/**
 * Header for one Project Health sub-tab. Renders one of three states: an
 * empty call-to-action before this pass has ever completed, a determinate
 * progress bar with a cancel button while the pass is in flight, or a
 * summary chip row (whose chips double as roll-up filters) with a re-run
 * button once the pass has finished.
 */
export const ProjectHealthHeader: FC<ProjectHealthHeaderProps> = ({
  scope,
  report,
  isRunning,
  hasCompletedRun,
  onRun,
  onCancel,
  activeFilter,
  onFilterChange,
}) => {
  if (isRunning) {
    return <RunningHeader report={report} onCancel={onCancel} />;
  }

  if (!hasCompletedRun || report === null) {
    return <EmptyHeader scope={scope} onRun={onRun} />;
  }

  return (
    <SummaryHeader
      scope={scope}
      report={report}
      onRun={onRun}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
    />
  );
};
