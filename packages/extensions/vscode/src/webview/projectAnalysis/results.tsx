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
import { hasFixableFindings } from "./helpers";
import { OverallSummary } from "./overallSummary";
import { PublintCard } from "./publintCard";
import { ReplacementsCard } from "./replacementsCard";
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
  /**
   * Hides the per-project "Fix with AI" callout. Set when the component
   * is embedded inside a Project Health row, which offers a single
   * aggregate fix prompt for the whole workspace instead.
   */
  hideFixWithAi?: boolean;
  /**
   * Hides the replacements card. Set when embedded in a Project Health
   * row, which shows replaceable dependencies in its own prominent box.
   */
  hideReplacements?: boolean;
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
  hideFixWithAi = false,
  hideReplacements = false,
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
  const replacementFindings = useMemo(
    () =>
      analysis.findings.filter((finding) => finding.source === "replacements"),
    [analysis.findings],
  );

  const totalSurfaced =
    publintFindings.length +
    circularFindings.length +
    (hideReplacements ? 0 : replacementFindings.length);
  const [expanded, setExpanded] = useState<ExpandedSection>("none");

  const toggle = useCallback((section: ExpandedSection) => {
    setExpanded((current) => (current === section ? "none" : section));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {!hideFixWithAi && hasFixableFindings(analysis.findings) && (
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
      {!hideReplacements && replacementFindings.length > 0 && (
        <ReplacementsCard
          findings={replacementFindings}
          postReveal={postReveal}
          expanded={expanded === "replacements"}
          onToggle={() => toggle("replacements")}
        />
      )}
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
