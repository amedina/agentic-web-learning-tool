/**
 * External dependencies.
 */
import { type FC } from "react";
import { Repeat, ShieldCheck } from "lucide-react";

/**
 * Internal dependencies.
 */
import { StatTile } from "./statTile";
import type { ExpandedSection } from "./types";

interface OverallSummaryProps {
  publintCount: number;
  circularCount: number;
  expanded: ExpandedSection;
  onSelect: (section: ExpandedSection) => void;
}

/**
 * Top-of-results banner with two compact stat tiles, one per analyzer.
 * Tiles are clickable: clicking one expands that section's card and
 * collapses the other. The currently expanded tile gets a brighter
 * outline so the link between header and body is obvious.
 */
export const OverallSummary: FC<OverallSummaryProps> = ({
  publintCount,
  circularCount,
  expanded,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatTile
        icon={<ShieldCheck size={14} />}
        label="Publishing"
        count={publintCount}
        tone={publintCount > 0 ? "warning" : "ok"}
        suffix={publintCount === 1 ? "issue" : "issues"}
        active={expanded === "publint"}
        onClick={() => onSelect("publint")}
      />
      <StatTile
        icon={<Repeat size={14} />}
        label="Circular deps"
        count={circularCount}
        tone={circularCount > 0 ? "warning" : "ok"}
        suffix={circularCount === 1 ? "cycle" : "cycles"}
        active={expanded === "circular"}
        onClick={() => onSelect("circular")}
      />
    </div>
  );
};
