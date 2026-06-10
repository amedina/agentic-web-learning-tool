/**
 * External dependencies.
 */
import { type FC } from "react";
import { Recycle, Repeat, Scale, ShieldCheck } from "lucide-react";

/**
 * Internal dependencies.
 */
import { CountBadge } from "./badges";
import { SeverityCountBadges } from "./severityCountBadges";
import { tallyVulnerabilities } from "./helpers";
import type { PackageHealthEntry } from "../../projectHealth/types";

interface RowBadgesProps {
  entry: PackageHealthEntry;
  severityCounts: ReturnType<typeof tallyVulnerabilities>;
}

/**
 * The compact badge cluster shown on a collapsed row: severity-split
 * vulnerability counts, the license issue count, and the project-level
 * publint and circular counts when a project analysis has run.
 */
export const RowBadges: FC<RowBadgesProps> = ({ entry, severityCounts }) => {
  const projectAnalysis = entry.projectAnalysis;
  return (
    <>
      <SeverityCountBadges counts={severityCounts} />
      <CountBadge
        icon={<Scale size={10} />}
        count={entry.licenseIssues.length}
        label={
          entry.licenseIssues.length === 1 ? "license issue" : "license issues"
        }
        tone="warning"
      />
      {projectAnalysis ? (
        <>
          <CountBadge
            icon={<ShieldCheck size={10} />}
            count={projectAnalysis.publintCount}
            label="publint issues"
            tone="warning"
          />
          <CountBadge
            icon={<Repeat size={10} />}
            count={projectAnalysis.circularCount}
            label="circular dependencies"
            tone="warning"
          />
          <CountBadge
            icon={<Recycle size={10} />}
            count={projectAnalysis.replaceableCount}
            label="replaceable dependencies"
            tone="info"
          />
        </>
      ) : null}
    </>
  );
};
