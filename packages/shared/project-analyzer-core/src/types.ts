/**
 * Severity levels used by project-level findings. Mirrors the spectrum used by
 * editor diagnostics so consumers can surface findings without re-mapping.
 */
export type FindingSeverity = "error" | "warning" | "info" | "hint";

/**
 * Where a finding was sourced from. Useful for grouping in UIs and for routing
 * fixes (e.g. only "replacements" findings have codemod-driven fixes).
 */
export type FindingSource = "publint" | "replacements";

/**
 * A single issue surfaced by a project-level analyzer.
 *
 * Designed to be uniform across analyzers so the UI layer can render one list.
 * `file` and `range` are optional because not every analyzer pinpoints a
 * location (e.g. a project-wide dep replacement applies to many files).
 */
export interface ProjectFinding {
  source: FindingSource;
  severity: FindingSeverity;
  /** Stable identifier for the rule that produced this finding. */
  code: string;
  message: string;
  /** Absolute path to the file the finding refers to, when applicable. */
  file?: string;
  /** 1-based line/column range inside `file`, when applicable. */
  range?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  /** Free-form metadata specific to the rule (e.g. package name, suggested replacement). */
  data?: Record<string, unknown>;
}

/**
 * Result of analyzing a project root. Shape is intentionally flat so it can be
 * serialized to JSON (for MCP tool responses) and consumed directly by VS Code
 * diagnostics.
 */
export interface ProjectAnalysis {
  rootPath: string;
  packageManager?: "npm" | "pnpm" | "yarn" | "bun" | "deno";
  findings: ProjectFinding[];
  /** Per-source counts so consumers can render summaries without re-iterating. */
  summary: {
    total: number;
    bySeverity: Record<FindingSeverity, number>;
    bySource: Record<FindingSource, number>;
  };
  /** Soft errors — analyzers that failed without aborting the whole run. */
  warnings: string[];
}
