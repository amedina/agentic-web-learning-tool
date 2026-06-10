/**
 * External dependencies.
 */
import { type FC } from "react";
import {
  FileBadge,
  Package,
  Recycle,
  RefreshCw,
  Scale,
  ShieldAlert,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import { SeverityBreakdown } from "./severityBreakdown";
import { SummaryChip } from "./summaryChip";
import { useSuppression } from "./suppressionContext";
import {
  entryHasActiveLicenseIssue,
  entryHasActiveVulnerability,
  entryHasReplaceable,
  formatRelativeTime,
  toggleFilter,
  type ListFilter,
} from "./helpers";
import type { ProjectHealthReport } from "../../projectHealth/types";

interface SummaryHeaderProps {
  report: ProjectHealthReport;
  onRun: () => void;
  activeFilter: ListFilter;
  onFilterChange: (filter: ListFilter) => void;
}

/**
 * Terminal state: a wrapped row of clickable summary chips that double as
 * filters (vulnerabilities, license issues, replaceable suggestions),
 * plus package / dependency counts, the relative "Last run" time, a
 * clickable suppressed note, and a re-run button. The vuln / license /
 * replaceable chips count the number of affected packages (not deduped
 * findings) so the chip value always equals the rows shown when clicked.
 */
export const SummaryHeader: FC<SummaryHeaderProps> = ({
  report,
  onRun,
  activeFilter,
  onFilterChange,
}) => {
  const { suppressions } = useSuppression();
  const { totals } = report;
  const { vulnerabilities } = totals;
  const hasVulnerabilities = vulnerabilities.total > 0;
  const vulnPackages = report.packages.filter((entry) =>
    entryHasActiveVulnerability(entry, suppressions),
  ).length;
  const licensePackages = report.packages.filter((entry) =>
    entryHasActiveLicenseIssue(entry, suppressions),
  ).length;
  const replaceablePackages = report.packages.filter((entry) =>
    entryHasReplaceable(entry),
  ).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Last run {formatRelativeTime(report.generatedAt)}
            {totals.suppressedCount > 0 ? (
              <>
                {" ("}
                <button
                  type="button"
                  className={`underline-offset-2 hover:underline ${
                    activeFilter === "suppressed"
                      ? "font-semibold text-sky-600 dark:text-sky-400"
                      : ""
                  }`}
                  onClick={() =>
                    onFilterChange(toggleFilter(activeFilter, "suppressed"))
                  }
                  title="Show only packages with a suppressed finding"
                >
                  {totals.suppressedCount} suppressed
                </button>
                {")"}
              </>
            ) : null}
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
          value={vulnPackages}
          label={vulnPackages === 1 ? "vuln pkg" : "vuln pkgs"}
          tone={vulnPackages > 0 ? "danger" : "ok"}
          title={`${vulnPackages} package(s) with vulnerabilities. Click to filter.`}
          onClick={() => onFilterChange(toggleFilter(activeFilter, "vuln"))}
          isActive={activeFilter === "vuln"}
        />
        <SummaryChip
          icon={<Scale size={13} />}
          value={licensePackages}
          label={licensePackages === 1 ? "license pkg" : "license pkgs"}
          tone={licensePackages > 0 ? "danger" : "ok"}
          title={`${licensePackages} package(s) with license issues. Click to filter.`}
          onClick={() => onFilterChange(toggleFilter(activeFilter, "license"))}
          isActive={activeFilter === "license"}
        />
        <SummaryChip
          icon={<Recycle size={13} />}
          value={replaceablePackages}
          label={
            replaceablePackages === 1 ? "replaceable pkg" : "replaceable pkgs"
          }
          tone={replaceablePackages > 0 ? "info" : "neutral"}
          title={`${replaceablePackages} package(s) with replacement suggestions. Click to filter.`}
          onClick={() =>
            onFilterChange(toggleFilter(activeFilter, "replaceable"))
          }
          isActive={activeFilter === "replaceable"}
        />
        <SummaryChip
          icon={<Package size={13} />}
          value={totals.packageCount}
          label={totals.packageCount === 1 ? "package" : "packages"}
          title="Number of package.json files analyzed. Click to show all."
          onClick={() => onFilterChange("all")}
        />
        <SummaryChip
          icon={<FileBadge size={13} />}
          value={totals.uniqueDependencyCount}
          label="deps"
          title="Distinct dependency versions analyzed across all package.json files. Click to show all."
          onClick={() => onFilterChange("all")}
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
