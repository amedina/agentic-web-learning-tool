/**
 * External dependencies.
 */
import type {
  FindingSeverity,
  ProjectAnalysis,
  ProjectFinding,
} from "@agentic-web-labs/project-analyzer-core";

/**
 * Reveals a finding's source location in the editor.
 */
export type PostReveal = (
  filePath: string,
  range?: ProjectFinding["range"],
) => void;

/**
 * Copies the given text to the clipboard, optionally surfacing a toast.
 */
export type PostCopyPrompt = (text: string, toast?: string) => void;

/**
 * Opens the MCP setup wizard.
 */
export type PostSetupMcp = () => void;

/**
 * Request/response state machine for an on-demand project analysis run.
 */
export type Status =
  | { kind: "idle" }
  | { kind: "running"; requestId: string; startedAt: number }
  | { kind: "ready"; analysis: ProjectAnalysis; finishedAt: number }
  | { kind: "error"; message: string };

/**
 * Which analyzer card is currently expanded. Only one is open at a
 * time; `none` means all are collapsed, which is the default state
 * after a run finishes (the stat tiles up top still surface the totals).
 */
export type ExpandedSection = "none" | "publint" | "circular" | "replacements";

/**
 * Tracks whether the displayed analysis is known to be out-of-date
 * because the host saw a change to `package.json`. We render the
 * existing findings dimmed with a "Re-run analysis" banner above them
 * rather than wiping the panel — losing previously-displayed
 * findings on every keystroke save is jarring and unhelpful.
 */
export interface StaleState {
  changedFileDisplayPath: string;
}

/**
 * Either a concrete finding severity or the "all severities" sentinel
 * used by the publint filter bar.
 */
export type SeverityFilter = FindingSeverity | "all";

/**
 * Active publint filter selection: a severity tier plus a free-text query.
 */
export interface FilterState {
  severity: SeverityFilter;
  query: string;
}

/**
 * Tally of how many publint findings there are at each severity tier.
 */
export interface PublintSummary {
  total: number;
  bySeverity: Record<FindingSeverity, number>;
}

/**
 * Per-edge metadata produced by the project-analyzer-core circular
 * dependency scanner. Mirrors `CycleEdge` from
 * `findCircularDependencies.ts`; duplicated here so the webview can
 * stay decoupled from the analyzer's exports.
 */
export interface CycleEdge {
  fromIndex: number;
  toIndex: number;
  symbols: string[];
  isTypeOnly: boolean;
  isSideEffectOnly: boolean;
}
