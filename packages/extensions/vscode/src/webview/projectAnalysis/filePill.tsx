/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import { shortenPath } from "./helpers";

interface FilePillProps {
  label: string;
  fullPath: string;
  dimmed?: boolean;
  onClick: () => void;
}

/**
 * Single clickable file-name pill used in the cycle chain. Truncates
 * the label to the last 2 path segments so long monorepo paths never
 * overflow the parent; the full path stays accessible via the title
 * attribute (tooltip) and the inline label is wrapped with break-all
 * as a hard guarantee against horizontal overflow.
 */
export const FilePill: FC<FilePillProps> = ({
  label,
  fullPath,
  dimmed,
  onClick,
}) => {
  const display = shortenPath(label);
  return (
    <button
      type="button"
      className={`font-mono text-[11px] leading-tight px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-900 max-w-full text-left break-all ${
        dimmed ? "opacity-60" : ""
      }`}
      onClick={onClick}
      title={fullPath}
    >
      {display}
    </button>
  );
};
