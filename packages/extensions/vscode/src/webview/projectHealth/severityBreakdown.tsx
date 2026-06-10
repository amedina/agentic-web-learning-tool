/**
 * External dependencies.
 */
import { type FC } from "react";

interface SeverityBreakdownProps {
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

/**
 * A single-line breakdown of vulnerability counts by severity tier,
 * shown under the headline chips. Each tier is colored to match the
 * shared severity palette (red/orange/amber/slate).
 */
export const SeverityBreakdown: FC<SeverityBreakdownProps> = ({
  critical,
  high,
  moderate,
  low,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
      <span className="font-medium text-red-600 dark:text-red-400">
        {critical} critical
      </span>
      <span className="font-medium text-orange-600 dark:text-orange-400">
        {high} high
      </span>
      <span className="font-medium text-amber-600 dark:text-amber-400">
        {moderate} moderate
      </span>
      <span className="font-medium text-slate-500 dark:text-slate-400">
        {low} low
      </span>
    </div>
  );
};
