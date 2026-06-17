/**
 * External dependencies.
 */
import type {
  FindingSeverity,
  ProjectFinding,
} from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import type { CycleEdge, FilterState, PublintSummary, Status } from "./types";

/**
 * Number of findings shown before a group truncates behind a "Show all"
 * button.
 */
export const INITIAL_GROUP_LIMIT = 50;

let nextRequestId = 0;

/**
 * Returns a process-unique identifier for a new analysis request.
 */
export const newRequestId = (): string => `pa-${Date.now()}-${++nextRequestId}`;

/**
 * Build the ready-to-paste prompt the "Copy prompt" button drops on the
 * clipboard. It tells an AI assistant to fix exactly the issue kinds
 * present (publishing and/or circular) via the npm-advisor MCP server,
 * scoped to this project root, and to verify afterwards.
 */
export function buildFixPrompt(
  rootPath: string,
  publintCount: number,
  circularCount: number,
): string {
  const lines: string[] = [
    `Fix the project-analysis issues in the project at ${rootPath} using the npm-advisor MCP server.`,
    "",
  ];
  if (publintCount > 0) {
    lines.push(
      `- ${publintCount} publishing-hygiene issue(s): run the \`fix-publishing-issues\` prompt (rootPath "${rootPath}"). Read the npm-advisor://publishing-hygiene-playbook resource, ignore findings under node_modules and build output, and apply the root-cause config fixes (package.json type/exports/files, bundler output).`,
    );
  }
  if (circularCount > 0) {
    lines.push(
      `- ${circularCount} circular-dependency cycle(s): run the \`fix-circular-dependencies\` prompt (rootPath "${rootPath}"). Break the offending import edge in each cycle with the least-invasive refactor.`,
    );
  }
  lines.push(
    "",
    "Show diffs before applying and re-run analyze_project to confirm the counts dropped.",
  );
  return lines.join("\n");
}

/**
 * Whether the per-project "Fix with AI" callout has anything actionable to
 * offer. The callout's prompt only addresses publishing-hygiene and
 * circular-dependency findings; replaceable-dependency suggestions are not
 * treated as issues and are absent from the prompt, so they do not on their
 * own justify showing the callout.
 */
export function hasFixableFindings(findings: ProjectFinding[]): boolean {
  return findings.some(
    (finding) =>
      finding.source === "publint" || finding.source === "circular-deps",
  );
}

/**
 * Tally of how many publint findings there are at each severity tier.
 */
export function summariseSeverity(findings: ProjectFinding[]): PublintSummary {
  const bySeverity: Record<FindingSeverity, number> = {
    error: 0,
    warning: 0,
    info: 0,
    hint: 0,
  };
  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
  }
  return { total: findings.length, bySeverity };
}

/**
 * Returns the subset of `findings` that match every active filter.
 * Filters are AND-ed: a finding has to match severity AND a
 * case-insensitive substring on its message / code / file / data.
 */
export function filterFindings(
  findings: ProjectFinding[],
  filters: FilterState,
): ProjectFinding[] {
  const needle = filters.query.trim().toLowerCase();
  return findings.filter((finding) => {
    if (filters.severity !== "all" && finding.severity !== filters.severity) {
      return false;
    }
    if (needle === "") {
      return true;
    }
    const haystack = [
      finding.message,
      finding.code,
      finding.file ?? "",
      typeof finding.data?.packageName === "string"
        ? (finding.data.packageName as string)
        : "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

/**
 * Shortens a file path for display by keeping just the last two
 * segments. Falls back to the full path for short ones so we don't
 * truncate trivial cases.
 */
export function shortenPath(filePath: string): string {
  const segments = filePath.split(/[\\/]+/);
  if (segments.length <= 2) {
    return filePath;
  }
  return `…/${segments.slice(-2).join("/")}`;
}

/** Returns true if the edge carries information worth showing in the UI. */
export function hasEdgeDetails(edge: CycleEdge): boolean {
  return edge.symbols.length > 0 || edge.isSideEffectOnly;
}

/**
 * Renders the symbols imported across a cycle edge as either a short,
 * truncated chip (for the compact pill chain) or the full list (for
 * tooltips and the expanded graph view). Caps the inline form at
 * three symbols and appends "+N more" so long re-export barrels don't
 * blow out the row width.
 */
export function summariseSymbols(
  symbols: string[],
  typeOnly: boolean,
  sideEffect: boolean,
  truncate: boolean,
): string {
  if (symbols.length === 0) {
    return sideEffect ? "side-effect import" : "";
  }
  const prefix = typeOnly ? "type " : "";
  if (!truncate || symbols.length <= 3) {
    return `${prefix}${symbols.join(", ")}`;
  }
  const head = symbols.slice(0, 3).join(", ");
  return `${prefix}${head}, +${symbols.length - 3} more`;
}

/**
 * Builds the "via …" suffix shown beneath the loop-back row. Matches
 * the compact inline form (truncated to 3 symbols max) so the callout
 * stays single-line in typical cases.
 */
export function describeEdge(edge: CycleEdge): string {
  if (edge.symbols.length === 0) {
    return edge.isSideEffectOnly ? "a side-effect import" : "an import";
  }
  return summariseSymbols(
    edge.symbols,
    edge.isTypeOnly,
    edge.isSideEffectOnly,
    true,
  );
}

/**
 * Returns the small line of text shown to the left of the run button.
 */
export function statusHint(status: Status): string {
  if (status.kind === "idle") {
    return "Not run yet";
  }
  if (status.kind === "running") {
    return "Running…";
  }
  if (status.kind === "ready") {
    return `Last run: ${formatRelative(status.finishedAt)}`;
  }
  return "Last run failed";
}

/**
 * Formats a millisecond epoch as a coarse "Xs / Xm / Xh ago" string,
 * good enough for the small status hint above the run button.
 */
export function formatRelative(epoch: number): string {
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - epoch) / 1000));
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s ago`;
  }
  const minutes = Math.round(elapsedSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
