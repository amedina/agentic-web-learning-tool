/**
 * External dependencies.
 */
import { useMemo, type FC } from "react";

/**
 * Internal dependencies.
 */
import { PackageHealthRow } from "./packageHealthRow";
import {
  entryMatchesFilter,
  packageIssueCount,
  type ListFilter,
} from "./helpers";
import { useSuppression } from "./suppressionContext";
import type { PackageHealthEntry } from "../../projectHealth/types";

interface PackageHealthListProps {
  /** Which sub-tab the list belongs to, threaded down to each row. */
  scope: "dependencies" | "project";
  packages: PackageHealthEntry[];
  filter: ListFilter;
  onClearFilter: () => void;
  onOpenPackageJson: (uri: string) => void;
}

/**
 * The workspace roll-up list for one sub-tab. Sorts packages by total
 * finding count descending (the noisiest manifests float to the top),
 * breaking ties by relative path, then narrows to the active filter.
 * Renders one collapsible row per visible package.
 */
export const PackageHealthList: FC<PackageHealthListProps> = ({
  scope,
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
    () =>
      sorted.filter((entry) => entryMatchesFilter(entry, filter, suppressions)),
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
            scope={scope}
            entry={entry}
            onOpenPackageJson={onOpenPackageJson}
          />
        ))}
      </ul>
    </div>
  );
};
