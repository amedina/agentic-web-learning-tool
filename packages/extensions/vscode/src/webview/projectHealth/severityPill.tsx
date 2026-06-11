/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import { severityTone } from "./helpers";
import type { VulnerabilitySeverity } from "../../projectHealth/types";

interface SeverityPillProps {
  severity: VulnerabilitySeverity;
}

/**
 * A small colored pill labelling one vulnerability's severity, colored
 * per the shared severity tone map (red/orange/amber/slate).
 */
export const SeverityPill: FC<SeverityPillProps> = ({ severity }) => {
  const tone = severityTone(severity);
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.pill}`}
    >
      {severity}
    </span>
  );
};
