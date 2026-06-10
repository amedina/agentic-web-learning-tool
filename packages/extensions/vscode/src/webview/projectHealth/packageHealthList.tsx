/**
 * External dependencies.
 */
import { useMemo, type FC } from "react";

/**
 * Internal dependencies.
 */
import { PackageHealthRow } from "./packageHealthRow";
import { packageIssueCount } from "./helpers";
import type { PackageHealthEntry } from "../../projectHealth/types";

interface PackageHealthListProps {
  packages: PackageHealthEntry[];
  onOpenPackageJson: (uri: string) => void;
}

/**
 * The workspace roll-up list. Sorts packages by total issue count
 * descending (the noisiest manifests float to the top), breaking ties
 * by relative path, and renders one collapsible row per package.
 */
export const PackageHealthList: FC<PackageHealthListProps> = ({
  packages,
  onOpenPackageJson,
}) => {
  const sorted = useMemo(() => {
    return [...packages].sort((first, second) => {
      const issueDelta = packageIssueCount(second) - packageIssueCount(first);
      if (issueDelta !== 0) {
        return issueDelta;
      }
      return first.relativePath.localeCompare(second.relativePath);
    });
  }, [packages]);

  if (sorted.length === 0) {
    return (
      <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-500 dark:text-slate-400">
        No package.json files found in this workspace.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded border border-slate-200 dark:border-slate-800">
      {sorted.map((entry) => (
        <PackageHealthRow
          key={entry.uri}
          entry={entry}
          onOpenPackageJson={onOpenPackageJson}
        />
      ))}
    </ul>
  );
};
