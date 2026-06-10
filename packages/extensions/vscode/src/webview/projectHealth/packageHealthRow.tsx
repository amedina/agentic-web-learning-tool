/**
 * External dependencies.
 */
import { useMemo, useState, type FC } from "react";
import { ChevronRight, CircleCheck, Loader2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import { RowBadges } from "./rowBadges";
import { RowDetails } from "./rowDetails";
import { isPackageClean, tallyVulnerabilities } from "./helpers";
import type { PackageHealthEntry } from "../../projectHealth/types";

interface PackageHealthRowProps {
  entry: PackageHealthEntry;
  onOpenPackageJson: (uri: string) => void;
}

/**
 * One collapsible roll-up row for a single package.json. Collapsed it
 * shows the path, name, and compact issue badges (vulnerabilities by
 * severity, license issues, publint, circular). Expanded it lists the
 * individual vulnerabilities and license issues and offers an
 * "Open package.json" affordance.
 */
export const PackageHealthRow: FC<PackageHealthRowProps> = ({
  entry,
  onOpenPackageJson,
}) => {
  const [expanded, setExpanded] = useState(false);
  const severityCounts = useMemo(
    () => tallyVulnerabilities(entry.vulnerabilities),
    [entry.vulnerabilities],
  );
  const isClean = isPackageClean(entry);
  const isAnalyzing = entry.status === "pending";

  return (
    <li className="bg-white/30 dark:bg-slate-900/30">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/60"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-xs font-medium text-slate-800 dark:text-slate-100"
            title={entry.relativePath}
          >
            {entry.relativePath}
          </div>
          {entry.name ? (
            <div
              className="truncate text-[11px] text-slate-500 dark:text-slate-400"
              title={entry.name}
            >
              {entry.name}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {isAnalyzing ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
              <Loader2 size={11} className="animate-spin" />
              analyzing
            </span>
          ) : (
            <RowBadges entry={entry} severityCounts={severityCounts} />
          )}
          {!isAnalyzing && isClean ? (
            <CircleCheck
              size={13}
              className="text-emerald-500 dark:text-emerald-400"
              aria-label="No issues"
            />
          ) : null}
        </div>
      </button>
      {expanded ? (
        <RowDetails entry={entry} onOpenPackageJson={onOpenPackageJson} />
      ) : null}
    </li>
  );
};
