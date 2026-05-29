/**
 * External dependencies.
 */
import React from "react";

/**
 * Pulsing placeholder bar rendered in place of a stat value (stars / collabs /
 * last-commit / fitness / license) while the per-package fetch is in flight.
 */
export const SkeletonValue: React.FC<{ width?: string }> = ({
  width = "w-10",
}) => (
  <span
    className={`inline-block h-4 ${width} rounded bg-slate-200 dark:bg-slate-700 animate-pulse align-middle`}
  />
);
