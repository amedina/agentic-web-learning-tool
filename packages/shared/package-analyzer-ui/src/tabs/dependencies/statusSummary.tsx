/**
 * External dependencies.
 */
import React from "react";
import { Loader2, ShieldAlert, Scale, Sparkles } from "lucide-react";

/**
 * Internal dependencies.
 */
import { type DependencyStatsState } from "../../hooks/useDependencyStats";
import { DEPENDENCIES_COLORS } from "../../theme/colors";
import { Badge } from "./badge";

/**
 * Renders the right-hand status of an accordion trigger: a loading/not-found/
 * error label while the fetch resolves, or once loaded the compact badges for
 * vulnerabilities, license issues and replaceability. Fitness is intentionally
 * omitted here — it is a composite that includes Responsiveness, which is not
 * loaded for dependency rows, so showing a partial-coverage score would
 * mislead.
 */
export const StatusSummary: React.FC<{ state: DependencyStatsState }> = ({
  state,
}) => {
  if (state.status === "pending" || state.status === "loading") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 size={12} className="animate-spin" />
        Loading
      </span>
    );
  }

  if (state.status === "not_found") {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Not on npmjs.com
      </span>
    );
  }

  if (state.status === "error") {
    return (
      <span className="text-xs text-red-600 dark:text-red-400">Error</span>
    );
  }

  const stats = state.stats;
  const vulnerabilityCount = stats.securityAdvisories?.issues?.length ?? 0;
  const hasLicenseIssue = stats.licenseCompatibility?.isCompatible === false;
  const recommendations = stats.recommendations;
  const isReplaceable =
    (recommendations?.nativeReplacements?.length ?? 0) > 0 ||
    (recommendations?.preferredReplacements?.length ?? 0) > 0 ||
    (recommendations?.microUtilityReplacements?.length ?? 0) > 0;

  return (
    <div className="flex items-center gap-1.5">
      {vulnerabilityCount > 0 && (
        <Badge
          color={DEPENDENCIES_COLORS.vulnerable}
          icon={<ShieldAlert size={10} />}
          title={`${vulnerabilityCount} vulnerabilit${vulnerabilityCount === 1 ? "y" : "ies"}`}
        >
          {vulnerabilityCount}
        </Badge>
      )}
      {hasLicenseIssue && (
        <Badge
          color={DEPENDENCIES_COLORS.licenseIssue}
          icon={<Scale size={10} />}
          title="License incompatible with target"
        />
      )}
      {isReplaceable && (
        <Badge
          color={DEPENDENCIES_COLORS.replaceable}
          icon={<Sparkles size={10} />}
          title="Modern replacement available"
        />
      )}
    </div>
  );
};
