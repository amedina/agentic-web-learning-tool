/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import { SEVERITY_ORDER, severityTone } from "./helpers";
import type { VulnerabilitySeverity } from "../../projectHealth/types";

interface SeverityCountBadgesProps {
  counts: Record<VulnerabilitySeverity, number>;
}

/**
 * Renders one tiny dotted count badge per non-empty severity tier, in
 * descending urgency order. Used in the collapsed row to summarize a
 * package's vulnerabilities without listing them.
 */
export const SeverityCountBadges: FC<SeverityCountBadgesProps> = ({
  counts,
}) => {
  const visible = SEVERITY_ORDER.filter((severity) => counts[severity] > 0);
  if (visible.length === 0) {
    return null;
  }
  return (
    <>
      {visible.map((severity) => {
        const tone = severityTone(severity);
        return (
          <span
            key={severity}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${tone.pill}`}
            title={`${counts[severity]} ${severity} ${
              counts[severity] === 1 ? "vulnerability" : "vulnerabilities"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {counts[severity]}
          </span>
        );
      })}
    </>
  );
};
