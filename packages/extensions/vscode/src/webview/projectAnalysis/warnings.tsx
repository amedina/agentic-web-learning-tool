/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Collapsible list of non-fatal analyzer warnings shown beneath the
 * results.
 */
export const Warnings: FC<{ warnings: string[] }> = ({ warnings }) => {
  return (
    <details className="rounded border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
      <summary className="cursor-pointer">
        {warnings.length} analyzer warning{warnings.length === 1 ? "" : "s"}
      </summary>
      <ul className="mt-1 list-disc pl-5">
        {warnings.map((warning, index) => (
          <li key={index}>{warning}</li>
        ))}
      </ul>
    </details>
  );
};
