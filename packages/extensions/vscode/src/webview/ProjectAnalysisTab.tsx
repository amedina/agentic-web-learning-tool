/**
 * External dependencies.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Info,
  Lightbulb,
  Loader2,
  PlayCircle,
  Search,
  X,
} from "lucide-react";
import type {
  FindingSeverity,
  ProjectAnalysis,
  ProjectFinding,
} from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import type { ExtensionMessage, PackageJsonFile } from "./protocol";

interface ProjectAnalysisTabProps {
  activeFile: PackageJsonFile | null;
  postRunRequest: (requestId: string, packageJsonUri: string) => void;
  postCacheRequest: (requestId: string, packageJsonUri: string) => void;
  postReveal: (filePath: string, range?: ProjectFinding["range"]) => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "running"; requestId: string; startedAt: number }
  | { kind: "ready"; analysis: ProjectAnalysis; finishedAt: number }
  | { kind: "error"; message: string };

let nextRequestId = 0;
const newRequestId = (): string => `pa-${Date.now()}-${++nextRequestId}`;

/**
 * Webview tab that runs project-level analysis (publint + replacement
 * opportunities) on demand. Owns its own request/response state via the
 * window message channel; the parent only supplies callbacks for posting
 * the request and revealing a finding's source location.
 */
export const ProjectAnalysisTab: FC<ProjectAnalysisTabProps> = ({
  activeFile,
  postRunRequest,
  postCacheRequest,
  postReveal,
}) => {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const statusRef = useRef(status);
  statusRef.current = status;
  const pendingCacheRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handle = (event: MessageEvent): void => {
      const data = event.data as ExtensionMessage | undefined;
      if (!data || typeof data !== "object" || !("type" in data)) {
        return;
      }
      if (data.type === "projectAnalysisResult") {
        const current = statusRef.current;
        if (
          current.kind !== "running" ||
          current.requestId !== data.requestId
        ) {
          return;
        }
        if (data.ok) {
          setStatus({
            kind: "ready",
            analysis: data.data,
            finishedAt: Date.now(),
          });
        } else {
          setStatus({ kind: "error", message: data.error });
        }
        return;
      }
      if (data.type === "cachedProjectAnalysis") {
        if (data.requestId !== pendingCacheRequestIdRef.current) {
          return;
        }
        pendingCacheRequestIdRef.current = null;
        if (!data.data) {
          return;
        }
        // Only adopt a cached result if the user hasn't already
        // kicked off a fresh run since we asked — otherwise we'd
        // stomp on the in-flight request.
        const current = statusRef.current;
        if (current.kind === "running") {
          return;
        }
        setStatus({
          kind: "ready",
          analysis: data.data.analysis,
          finishedAt: data.data.finishedAt,
        });
      }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);

  // Ask the host for any cached result every time the active file
  // changes (including initial mount and tab re-mount). Survives the
  // webview-script-context reset VSCode does on visibility flips.
  useEffect(() => {
    if (!activeFile) {
      setStatus({ kind: "idle" });
      pendingCacheRequestIdRef.current = null;
      return;
    }
    const requestId = newRequestId();
    pendingCacheRequestIdRef.current = requestId;
    postCacheRequest(requestId, activeFile.uri);
  }, [activeFile, postCacheRequest]);

  const handleRun = useCallback(() => {
    if (!activeFile) {
      return;
    }
    const requestId = newRequestId();
    pendingCacheRequestIdRef.current = null;
    setStatus({ kind: "running", requestId, startedAt: Date.now() });
    postRunRequest(requestId, activeFile.uri);
  }, [activeFile, postRunRequest]);

  if (!activeFile) {
    return (
      <div className="text-slate-500 dark:text-slate-400 p-4 text-sm">
        Open a package.json to enable project analysis.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <Header
        status={status}
        onRun={handleRun}
        disabled={status.kind === "running"}
      />
      <Body status={status} postReveal={postReveal} />
    </div>
  );
};

interface HeaderProps {
  status: Status;
  onRun: () => void;
  disabled: boolean;
}

/**
 * Renders the run button and a one-line status hint above the body.
 */
const Header: FC<HeaderProps> = ({ status, onRun, disabled }) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {statusHint(status)}
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onRun}
        disabled={disabled}
      >
        {status.kind === "running" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <PlayCircle size={12} />
        )}
        {status.kind === "ready" ? "Re-run analysis" : "Run analysis"}
      </button>
    </div>
  );
};

interface BodyProps {
  status: Status;
  postReveal: ProjectAnalysisTabProps["postReveal"];
}

/**
 * Renders the body of the tab. Shows an empty/loading/error state, or
 * the summary + grouped findings list once analysis succeeds.
 */
const Body: FC<BodyProps> = ({ status, postReveal }) => {
  if (status.kind === "idle") {
    return <IdleExplainer />;
  }
  if (status.kind === "running") {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 size={14} className="animate-spin" />
        Analyzing project…
      </div>
    );
  }
  if (status.kind === "error") {
    return (
      <div className="rounded border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
        Analysis failed: {status.message}
      </div>
    );
  }
  return <Results analysis={status.analysis} postReveal={postReveal} />;
};

interface ResultsProps {
  analysis: ProjectAnalysis;
  postReveal: ProjectAnalysisTabProps["postReveal"];
}

type SeverityFilter = FindingSeverity | "all";

interface FilterState {
  severity: SeverityFilter;
  query: string;
}

const INITIAL_GROUP_LIMIT = 50;

/**
 * Renders the summary header, the filter bar, and the grouped findings
 * list. The tab is scoped to publint (publishing-readiness) findings —
 * replacement-opportunity findings live on the Dependencies tab per
 * package, so surfacing them here too would duplicate the signal. The
 * analyzer still produces both kinds for the Problems panel and the
 * MCP `analyze_project` tool; we just filter to publint at this layer.
 */
const Results: FC<ResultsProps> = ({ analysis, postReveal }) => {
  const publintFindings = useMemo(
    () => analysis.findings.filter((finding) => finding.source === "publint"),
    [analysis.findings],
  );
  const publintSummary = useMemo(
    () => summariseSeverity(publintFindings),
    [publintFindings],
  );

  const [filters, setFilters] = useState<FilterState>({
    severity: "all",
    query: "",
  });

  const filtered = useMemo(
    () => filterFindings(publintFindings, filters),
    [publintFindings, filters],
  );

  if (publintFindings.length === 0) {
    return (
      <div className="rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-3 text-sm text-emerald-700 dark:text-emerald-300">
        No publishing-readiness issues found.
        {analysis.warnings.length > 0 && (
          <Warnings warnings={analysis.warnings} />
        )}
      </div>
    );
  }

  const isFiltered = filters.severity !== "all" || filters.query.trim() !== "";

  return (
    <div className="flex flex-col gap-3">
      <Summary
        summary={publintSummary}
        filters={filters}
        onChange={setFilters}
        filteredCount={filtered.length}
        isFiltered={isFiltered}
      />
      {filtered.length === 0 ? (
        <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-500 dark:text-slate-400">
          No findings match the active filters.{" "}
          <button
            type="button"
            className="underline-offset-2 hover:underline text-slate-700 dark:text-slate-200"
            onClick={() => setFilters({ severity: "all", query: "" })}
          >
            Clear filters
          </button>
          .
        </div>
      ) : (
        <FindingGroup
          title="Publishing hygiene (publint)"
          findings={filtered}
          postReveal={postReveal}
        />
      )}
      {analysis.warnings.length > 0 && (
        <Warnings warnings={analysis.warnings} />
      )}
    </div>
  );
};

/**
 * Tally of how many publint findings there are at each severity tier.
 * Recomputed off the publint-only subset so the filter chips never
 * include counts from sources the tab no longer shows.
 */
interface PublintSummary {
  total: number;
  bySeverity: Record<FindingSeverity, number>;
}

function summariseSeverity(findings: ProjectFinding[]): PublintSummary {
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
function filterFindings(
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
 * Empty-state explainer shown before the user kicks off the first run.
 * Scoped to publint (publishing readiness) — dependency-replacement
 * insights live on the Dependencies tab per package, so we don't
 * duplicate them here.
 */
const IdleExplainer: FC = () => {
  return (
    <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300">
      <p>
        Click <span className="font-medium">Run analysis</span> to check this
        project&apos;s publishing readiness. Read-only — never modifies files.
      </p>
      <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-900/30">
        <div className="font-semibold text-slate-700 dark:text-slate-200">
          Publishing hygiene{" "}
          <span className="text-xs font-normal text-slate-500">
            (powered by{" "}
            <a
              href="https://publint.dev"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              publint
            </a>
            )
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Catches mistakes that would break consumers of your package after
          it&apos;s published: incorrect{" "}
          <code className="font-mono">exports</code>, missing types, ESM/CJS
          mismatches, files missing from{" "}
          <code className="font-mono">files</code>, deprecated fields, etc.
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Results land here and in the Problems panel. Subsequent runs are manual
        — analysis never fires on save.
      </p>
    </div>
  );
};

interface SummaryProps {
  summary: PublintSummary;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  filteredCount: number;
  isFiltered: boolean;
}

/**
 * Combined summary + filter bar. The severity counts double as
 * toggleable filter chips: clicking "5 errors" narrows the list to
 * errors; clicking the active chip (or "total") clears the severity
 * filter. A free-text search input sits below for filtering by
 * message, code, file, or rule arguments.
 */
const Summary: FC<SummaryProps> = ({
  summary,
  filters,
  onChange,
  filteredCount,
  isFiltered,
}) => {
  const toggleSeverity = useCallback(
    (next: SeverityFilter) => {
      onChange({
        ...filters,
        severity: filters.severity === next ? "all" : next,
      });
    },
    [filters, onChange],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <FilterChip
          label={`${summary.total} total`}
          tone="neutral"
          isActive={filters.severity === "all"}
          onClick={() => onChange({ ...filters, severity: "all" })}
        />
        {summary.bySeverity.error > 0 && (
          <FilterChip
            label={`${summary.bySeverity.error} errors`}
            tone="error"
            isActive={filters.severity === "error"}
            onClick={() => toggleSeverity("error")}
          />
        )}
        {summary.bySeverity.warning > 0 && (
          <FilterChip
            label={`${summary.bySeverity.warning} warnings`}
            tone="warning"
            isActive={filters.severity === "warning"}
            onClick={() => toggleSeverity("warning")}
          />
        )}
        {summary.bySeverity.info > 0 && (
          <FilterChip
            label={`${summary.bySeverity.info} info`}
            tone="info"
            isActive={filters.severity === "info"}
            onClick={() => toggleSeverity("info")}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={12}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={filters.query}
            onChange={(event) =>
              onChange({ ...filters, query: event.target.value })
            }
            placeholder="Filter by rule code, file, message…"
            className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
        {isFiltered && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => onChange({ severity: "all", query: "" })}
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
      {isFiltered && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing {filteredCount} of {summary.total}.
        </div>
      )}
    </div>
  );
};

interface FilterChipProps {
  label: string;
  tone: "neutral" | "error" | "warning" | "info";
  isActive: boolean;
  onClick: () => void;
}

const FilterChip: FC<FilterChipProps> = ({
  label,
  tone,
  isActive,
  onClick,
}) => {
  const palette: Record<FilterChipProps["tone"], string> = {
    neutral:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
    error:
      "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900",
    warning:
      "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900",
    info: "bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:hover:bg-sky-900",
  };
  const ring = isActive ? "ring-1 ring-sky-500 dark:ring-sky-400" : "ring-0";
  return (
    <button
      type="button"
      className={`px-2 py-0.5 rounded font-medium ${palette[tone]} ${ring}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

interface FindingGroupProps {
  title: string;
  findings: ProjectFinding[];
  postReveal: ProjectAnalysisTabProps["postReveal"];
}

const FindingGroup: FC<FindingGroupProps> = ({
  title,
  findings,
  postReveal,
}) => {
  const [showAll, setShowAll] = useState(false);
  const total = findings.length;
  const visible =
    showAll || total <= INITIAL_GROUP_LIMIT
      ? findings
      : findings.slice(0, INITIAL_GROUP_LIMIT);
  return (
    <section className="rounded border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
      <header className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {visible.length === total ? total : `${visible.length} of ${total}`}
        </span>
      </header>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {visible.map((finding, index) => (
          <FindingRow
            key={`${finding.source}-${finding.code}-${index}`}
            finding={finding}
            postReveal={postReveal}
          />
        ))}
      </ul>
      {visible.length < total && (
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            type="button"
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
            onClick={() => setShowAll(true)}
          >
            Show all {total} findings
          </button>
        </div>
      )}
    </section>
  );
};

interface FindingRowProps {
  finding: ProjectFinding;
  postReveal: ProjectAnalysisTabProps["postReveal"];
}

const FindingRow: FC<FindingRowProps> = ({ finding, postReveal }) => {
  const handleOpen = useCallback(() => {
    if (!finding.file) {
      return;
    }
    postReveal(finding.file, finding.range);
  }, [finding, postReveal]);

  const documentationUrl =
    typeof finding.data?.documentationUrl === "string"
      ? finding.data.documentationUrl
      : undefined;

  return (
    <li className="px-3 py-2 flex items-start gap-2 text-sm">
      <SeverityIcon severity={finding.severity} />
      <div className="flex-1 min-w-0">
        <div className="text-slate-700 dark:text-slate-200 wrap-break-word">
          {finding.message}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <code className="font-mono">{finding.code}</code>
          {finding.file && (
            <button
              type="button"
              className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
              onClick={handleOpen}
            >
              Open file
            </button>
          )}
          {documentationUrl && (
            <a
              href={documentationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
            >
              Docs
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </li>
  );
};

const SeverityIcon: FC<{ severity: ProjectFinding["severity"] }> = ({
  severity,
}) => {
  switch (severity) {
    case "error":
      return (
        <AlertCircle
          size={14}
          className="text-red-600 dark:text-red-400 shrink-0 mt-0.5"
        />
      );
    case "warning":
      return (
        <AlertTriangle
          size={14}
          className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
        />
      );
    case "info":
      return (
        <Info
          size={14}
          className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5"
        />
      );
    case "hint":
    default:
      return (
        <Lightbulb
          size={14}
          className="text-slate-500 dark:text-slate-400 shrink-0 mt-0.5"
        />
      );
  }
};

const Warnings: FC<{ warnings: string[] }> = ({ warnings }) => {
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

/**
 * Returns the small line of text shown to the left of the run button.
 */
function statusHint(status: Status): string {
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
function formatRelative(epoch: number): string {
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
