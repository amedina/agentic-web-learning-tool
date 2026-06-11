/**
 * External dependencies.
 */
import { type FC } from "react";
import { Recycle } from "lucide-react";
import type { ProjectFinding } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { CollapsibleCard } from "./collapsibleCard";
import { FindingList } from "./findingList";
import type { PostReveal } from "./types";

interface ReplacementsCardProps {
  findings: ProjectFinding[];
  postReveal: PostReveal;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Collapsible card listing e18e replacement opportunities, the lighter
 * alternatives suggested for a dependency. These are informational
 * optimizations rather than problems, so the badge stays neutral.
 */
export const ReplacementsCard: FC<ReplacementsCardProps> = ({
  findings,
  postReveal,
  expanded,
  onToggle,
}) => {
  return (
    <CollapsibleCard
      title="Replaceable dependencies"
      subtitle={<span>lighter alternatives (e18e)</span>}
      icon={<Recycle size={14} />}
      badge={findings.length}
      badgeTone={findings.length > 0 ? "warning" : "ok"}
      collapsed={!expanded}
      onToggle={onToggle}
    >
      {findings.length === 0 ? (
        <div className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
          No replacement suggestions.
        </div>
      ) : (
        <div className="px-3 py-3">
          <FindingList findings={findings} postReveal={postReveal} />
        </div>
      )}
    </CollapsibleCard>
  );
};
