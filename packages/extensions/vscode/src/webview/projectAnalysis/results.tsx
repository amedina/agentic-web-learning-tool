/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type FC } from "react";
import { ShieldCheck } from "lucide-react";
import type { ProjectAnalysis } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { CircularDependenciesCard } from "./circularDependenciesCard";
import { FixWithAiCallout } from "./fixWithAiCallout";
import { OverallSummary } from "./overallSummary";
import { PublintCard } from "./publintCard";
import { Warnings } from "./warnings";
import type {
  ExpandedSection,
  PostCopyPrompt,
  PostReveal,
  PostSetupMcp,
} from "./types";

interface ResultsProps {
  analysis: ProjectAnalysis;
  postReveal: PostReveal;
  postCopyPrompt: PostCopyPrompt;
  postSetupMcp: PostSetupMcp;
}

/**
 * Renders the per-source insight cards. The tab surfaces two analyzers:
 * publint (publishing-readiness) and madge (circular dependencies).
 * Both cards start collapsed so the user can see the headline counts;
 * clicking a stat tile or a card header expands that section and
 * collapses the other (only one open at a time).
 */
export const Results: FC<ResultsProps> = ({
  analysis,
  postReveal,
  postCopyPrompt,
  postSetupMcp,
}) => {
  const publintFindings = useMemo(
    () => analysis.findings.filter((finding) => finding.source === "publint"),
    [analysis.findings],
  );
  const circularFindings = useMemo(
    () =>
      analysis.findings.filter((finding) => finding.source === "circular-deps"),
    [analysis.findings],
  );

  const totalSurfaced = publintFindings.length + circularFindings.length;
  const [expanded, setExpanded] = useState<ExpandedSection>("none");

  const toggle = useCallback((section: ExpandedSection) => {
    setExpanded((current) => (current === section ? "none" : section));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {totalSurfaced > 0 && (
        <FixWithAiCallout
          rootPath={analysis.rootPath}
          publintCount={publintFindings.length}
          circularCount={circularFindings.length}
          postCopyPrompt={postCopyPrompt}
          postSetupMcp={postSetupMcp}
        />
      )}
      <OverallSummary
        publintCount={publintFindings.length}
        circularCount={circularFindings.length}
        expanded={expanded}
        onSelect={(section) => setExpanded(section)}
      />
      <PublintCard
        findings={publintFindings}
        postReveal={postReveal}
        expanded={expanded === "publint"}
        onToggle={() => toggle("publint")}
      />
      <CircularDependenciesCard
        findings={circularFindings}
        postReveal={postReveal}
        expanded={expanded === "circular"}
        onToggle={() => toggle("circular")}
      />
      {totalSurfaced === 0 && (
        <div className="rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
          <ShieldCheck size={16} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">All clear.</div>
            <div className="text-xs mt-0.5">
              No publishing issues or circular dependencies detected.
            </div>
          </div>
        </div>
      )}
      {analysis.warnings.length > 0 && (
        <Warnings warnings={analysis.warnings} />
      )}
    </div>
  );
};
