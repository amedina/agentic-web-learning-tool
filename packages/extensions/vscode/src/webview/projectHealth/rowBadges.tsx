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
  /** Which sub-tab the row belongs to, selecting which badges to show. */
  scope: "dependencies" | "project";
  entry: PackageHealthEntry;
  severityCounts: ReturnType<typeof tallyVulnerabilities>;
}

/**
 * The compact badge cluster shown on a collapsed row. On the Dependencies
 * sub-tab it shows the severity-split vulnerability counts, the license
 * issue count, and the replaceable-dependency count; on the Project
 * Analysis sub-tab it shows the publint and circular counts (once the
 * analysis has run).
 */
export const RowBadges: FC<RowBadgesProps> = ({
  scope,
  entry,
  severityCounts,
}) => {
  if (scope === "dependencies") {
    return (
      <>
        <SeverityCountBadges counts={severityCounts} />
        <CountBadge
          icon={<Scale size={10} />}
          count={entry.licenseIssues.length}
          label={
            entry.licenseIssues.length === 1
              ? "license issue"
              : "license issues"
          }
          tone="warning"
        />
        <CountBadge
          icon={<Recycle size={10} />}
          count={entry.replaceable.length}
          label={
            entry.replaceable.length === 1
              ? "replaceable dependency (lighter alternative available)"
              : "replaceable dependencies (lighter alternatives available)"
          }
          tone="info"
        />
      </>
    );
  }

  const projectAnalysis = entry.projectAnalysis;
  if (!projectAnalysis) {
    return null;
  }
  return (
    <>
      <CountBadge
        icon={<ShieldCheck size={10} />}
        count={projectAnalysis.publintCount}
        label={
          projectAnalysis.publintCount === 1
            ? "publishing (publint) issue"
            : "publishing (publint) issues"
        }
        tone="warning"
      />
      <CountBadge
        icon={<Repeat size={10} />}
        count={projectAnalysis.circularCount}
        label={
          projectAnalysis.circularCount === 1
            ? "circular dependency"
            : "circular dependencies"
        }
        tone="warning"
      />
    </>
  );
};
