/**
 * External dependencies.
 */
import { useMemo, type FC } from "react";

/**
 * Internal dependencies.
 */
import { PackageHealthRow } from "./packageHealthRow";
import { packageIssueCount, type ListFilter } from "./helpers";
import { useSuppression } from "./suppressionContext";
import {
  isLicenseSuppressed,
  isVulnerabilitySuppressed,
} from "../../projectHealth/suppressionMatching";
import type {
  PackageHealthEntry,
  SuppressionEntry,
} from "../../projectHealth/types";

interface PackageHealthListProps {
  packages: PackageHealthEntry[];
  filter: ListFilter;
  onClearFilter: () => void;
  onOpenPackageJson: (uri: string) => void;
}

/** True when a package carries at least one currently-suppressed finding. */
function entryHasSuppressed(
  entry: PackageHealthEntry,
  suppressions: SuppressionEntry[],
): boolean {
  return (
    entry.vulnerabilities.some((finding) =>
      isVulnerabilitySuppressed(suppressions, finding),
    ) ||
    entry.licenseIssues.some((finding) =>
      isLicenseSuppressed(suppressions, finding),
    )
  );
}

/** Decides whether a package passes the active roll-up filter. */
function matchesFilter(
  entry: PackageHealthEntry,
  filter: ListFilter,
  suppressions: SuppressionEntry[],
): boolean {
  switch (filter) {
    case "vuln":
      return entry.vulnerabilities.length > 0;
    case "license":
      return entry.licenseIssues.length > 0;
    case "replaceable":
      return (entry.projectAnalysis?.replaceableCount ?? 0) > 0;
    case "suppressed":
      return entryHasSuppressed(entry, suppressions);
    case "all":
    default:
      return true;
  }
}

/**
 * The workspace roll-up list. Sorts packages by total finding count
 * descending (the noisiest manifests float to the top), breaking ties by
 * relative path, then narrows to the active filter. Renders one
 * collapsible row per visible package.
 */
export const PackageHealthList: FC<PackageHealthListProps> = ({
  packages,
  filter,
  onClearFilter,
  onOpenPackageJson,
}) => {
  const { suppressions } = useSuppression();

  const sorted = useMemo(() => {
    return [...packages].sort((first, second) => {
      const issueDelta = packageIssueCount(second) - packageIssueCount(first);
      if (issueDelta !== 0) {
        return issueDelta;
      }
      return first.relativePath.localeCompare(second.relativePath);
    });
  }, [packages]);

  const visible = useMemo(
    () => sorted.filter((entry) => matchesFilter(entry, filter, suppressions)),
    [sorted, filter, suppressions],
  );

  if (packages.length === 0) {
    return (
      <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-500 dark:text-slate-400">
        No package.json files found in this workspace.
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-500 dark:text-slate-400">
        <span>No packages match this filter.</span>
        <button
          type="button"
          className="text-xs text-sky-600 hover:underline dark:text-sky-400"
          onClick={onClearFilter}
        >
          Show all packages
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {filter !== "all" ? (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Showing {visible.length} of {packages.length} packages
          </span>
          <button
            type="button"
            className="text-sky-600 hover:underline dark:text-sky-400"
            onClick={onClearFilter}
          >
            Show all
          </button>
        </div>
      ) : null}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded border border-slate-200 dark:border-slate-800">
        {visible.map((entry) => (
          <PackageHealthRow
            key={entry.uri}
            entry={entry}
            onOpenPackageJson={onOpenPackageJson}
          />
        ))}
      </ul>
    </div>
  );
};
