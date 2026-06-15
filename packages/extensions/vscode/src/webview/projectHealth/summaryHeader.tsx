/**
 * External dependencies.
 */
import { type FC } from "react";
import {
  FileBadge,
  Package,
  Recycle,
  RefreshCw,
  Repeat,
  Scale,
  ShieldAlert,
  ShieldCheck,
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
  entryHasCircular,
  entryHasPublint,
  entryHasReplaceable,
  formatRelativeTime,
  toggleFilter,
  type ListFilter,
} from "./helpers";
import type { ProjectHealthReport } from "../../projectHealth/types";

interface SummaryHeaderProps {
  /** Which sub-tab this summary belongs to, selecting the chips + run scope. */
  scope: "dependencies" | "project";
  report: ProjectHealthReport;
  /** Re-run the pass for this sub-tab's scope. */
  onRun: () => void;
  activeFilter: ListFilter;
  onFilterChange: (filter: ListFilter) => void;
}

/**
 * Terminal state for one sub-tab: a row of clickable summary chips that
 * double as filters, the relative "Last run" time, and a re-run button.
 * The Dependencies tab shows vulnerability + license chips (plus the
 * static package / dependency counts and the suppressed note); the
 * Project Analysis tab shows publint + circular + replaceable chips. Each
 * finding chip counts the number of affected packages (not deduped
 * findings) so the chip value always equals the rows shown when clicked.
 */
export const SummaryHeader: FC<SummaryHeaderProps> = ({
  scope,
  report,
  onRun,
  activeFilter,
  onFilterChange,
}) => {
  const { suppressions } = useSuppression();
  const { totals } = report;
  const { vulnerabilities } = totals;
  const isDependencies = scope === "dependencies";
  const hasVulnerabilities = vulnerabilities.total > 0;
  const lastRunEpoch = isDependencies
    ? (report.fastPassCompletedAt ?? report.generatedAt)
    : (report.backfillCompletedAt ?? report.generatedAt);

  const vulnPackages = report.packages.filter((entry) =>
    entryHasActiveVulnerability(entry, suppressions),
  ).length;
  const licensePackages = report.packages.filter((entry) =>
    entryHasActiveLicenseIssue(entry, suppressions),
  ).length;
  const replaceablePackages = report.packages.filter((entry) =>
    entryHasReplaceable(entry),
  ).length;
  const publintPackages = report.packages.filter((entry) =>
    entryHasPublint(entry),
  ).length;
  const circularPackages = report.packages.filter((entry) =>
    entryHasCircular(entry),
  ).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Last run {formatRelativeTime(lastRunEpoch)}
            {isDependencies && totals.suppressedCount > 0 ? (
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
        {isDependencies ? (
          <>
            <SummaryChip
              icon={<ShieldAlert size={13} />}
              value={vulnPackages}
              label="vulnerabilities"
              tone={vulnPackages > 0 ? "danger" : "ok"}
              title={`${vulnPackages} package(s) with vulnerabilities. Click to filter.`}
              onClick={() => onFilterChange(toggleFilter(activeFilter, "vuln"))}
              isActive={activeFilter === "vuln"}
            />
            <SummaryChip
              icon={<Scale size={13} />}
              value={licensePackages}
              label="license issues"
              tone={licensePackages > 0 ? "danger" : "ok"}
              title={`${licensePackages} package(s) with license issues. Click to filter.`}
              onClick={() =>
                onFilterChange(toggleFilter(activeFilter, "license"))
              }
              isActive={activeFilter === "license"}
            />
            <SummaryChip
              icon={<Recycle size={13} />}
              value={replaceablePackages}
              label="replaceable"
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
              title="Number of package.json files analyzed."
            />
            <SummaryChip
              icon={<FileBadge size={13} />}
              value={totals.uniqueDependencyCount}
              label="deps"
              title="Distinct dependency versions analyzed across all package.json files."
            />
          </>
        ) : (
          <>
            <SummaryChip
              icon={<ShieldCheck size={13} />}
              value={publintPackages}
              label={
                publintPackages === 1 ? "publishing pkg" : "publishing pkgs"
              }
              tone={publintPackages > 0 ? "warning" : "ok"}
              title={`${publintPackages} package(s) with publishing (publint) issues. Click to filter.`}
              onClick={() =>
                onFilterChange(toggleFilter(activeFilter, "publint"))
              }
              isActive={activeFilter === "publint"}
            />
            <SummaryChip
              icon={<Repeat size={13} />}
              value={circularPackages}
              label={circularPackages === 1 ? "circular pkg" : "circular pkgs"}
              tone={circularPackages > 0 ? "warning" : "ok"}
              title={`${circularPackages} package(s) with circular dependencies. Click to filter.`}
              onClick={() =>
                onFilterChange(toggleFilter(activeFilter, "circular"))
              }
              isActive={activeFilter === "circular"}
            />
            <SummaryChip
              icon={<Package size={13} />}
              value={totals.packageCount}
              label={totals.packageCount === 1 ? "package" : "packages"}
              title="Number of package.json files analyzed."
            />
          </>
        )}
      </div>
      {isDependencies && hasVulnerabilities ? (
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
