/**
 * External dependencies.
 */
import { type FC } from "react";
import {
  FileBadge,
  Package,
  RefreshCw,
  Scale,
  ShieldAlert,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import { SeverityBreakdown } from "./severityBreakdown";
import { SummaryChip } from "./summaryChip";
import { formatRelativeTime } from "./helpers";
import type { ProjectHealthReport } from "../../projectHealth/types";

interface SummaryHeaderProps {
  report: ProjectHealthReport;
  onRun: () => void;
}

/**
 * Terminal state: a wrapped row of summary chips (vulnerabilities split
 * by severity, license issues, package count, unique dependency count),
 * the relative "Last run" time, an optional suppressed note, and a
 * re-run button.
 */
export const SummaryHeader: FC<SummaryHeaderProps> = ({ report, onRun }) => {
  const { totals } = report;
  const { vulnerabilities } = totals;
  const hasVulnerabilities = vulnerabilities.total > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Last run {formatRelativeTime(report.generatedAt)}
            {totals.suppressedCount > 0
              ? ` (${totals.suppressedCount} suppressed)`
              : ""}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={onRun}
        >
          <RefreshCw size={12} />
          Re-run
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <SummaryChip
          icon={<ShieldAlert size={13} />}
          value={vulnerabilities.total}
          label={vulnerabilities.total === 1 ? "vuln" : "vulns"}
          tone={hasVulnerabilities ? "danger" : "ok"}
          title="Total vulnerabilities across the workspace"
        />
        <SummaryChip
          icon={<Scale size={13} />}
          value={totals.licenseIssueCount}
          label={totals.licenseIssueCount === 1 ? "license" : "licenses"}
          tone={totals.licenseIssueCount > 0 ? "danger" : "ok"}
          title="License issues across the workspace"
        />
        <SummaryChip
          icon={<Package size={13} />}
          value={totals.packageCount}
          label={totals.packageCount === 1 ? "package" : "packages"}
          title="package.json files analyzed"
        />
        <SummaryChip
          icon={<FileBadge size={13} />}
          value={totals.uniqueDependencyCount}
          label="deps"
          title="Unique dependencies across the workspace"
        />
      </div>
      {hasVulnerabilities ? (
        <SeverityBreakdown
          critical={vulnerabilities.critical}
          high={vulnerabilities.high}
          moderate={vulnerabilities.moderate}
          low={vulnerabilities.low + vulnerabilities.unknown}
        />
      ) : null}
    </div>
  );
};
