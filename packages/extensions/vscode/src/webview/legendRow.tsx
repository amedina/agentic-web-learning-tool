/**
 * External dependencies.
 */
import { type FC } from "react";

interface LegendRowProps {
  swatchClass: string;
  label: string;
  description: string;
}

/** One row of the diagnostic legend: colored swatch + label + description. */
export const LegendRow: FC<LegendRowProps> = ({
  swatchClass,
  label,
  description,
}) => (
  <li className="flex items-start gap-2">
    <span
      className={`shrink-0 mt-1 inline-block w-2.5 h-2.5 rounded-full ${swatchClass}`}
      aria-hidden
    />
    <div className="min-w-0">
      <span className="font-medium text-slate-800 dark:text-slate-200">
        {label}
      </span>
      <span className="text-slate-600 dark:text-slate-400">
        {" "}
        — {description}
      </span>
    </div>
  </li>
);
