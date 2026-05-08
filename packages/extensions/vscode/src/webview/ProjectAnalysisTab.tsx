/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Info,
  Lightbulb,
  Loader2,
  PlayCircle,
} from "lucide-react";
import type {
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
  postReveal: (fileUri: string, range?: ProjectFinding["range"]) => void;
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
  postReveal,
}) => {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    const handle = (event: MessageEvent): void => {
      const data = event.data as ExtensionMessage | undefined;
      if (!data || typeof data !== "object" || !("type" in data)) {
        return;
      }
      if (data.type !== "projectAnalysisResult") {
        return;
      }
      const current = statusRef.current;
      if (current.kind !== "running" || current.requestId !== data.requestId) {
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
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);

  const handleRun = useCallback(() => {
    if (!activeFile) {
      return;
    }
    const requestId = newRequestId();
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
    return (
      <div className="text-slate-500 dark:text-slate-400 text-sm">
        Click <span className="font-medium">Run analysis</span> to scan this
        project for publishing-hygiene issues (publint) and dependencies that
        have lighter alternatives (e18e).
      </div>
    );
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

/**
 * Renders the summary header + grouped findings list. Findings with no
 * source pin (i.e. analyzer-level warnings) appear under their own
 * collapsed section so the main list stays focused.
 */
const Results: FC<ResultsProps> = ({ analysis, postReveal }) => {
  const publint = analysis.findings.filter((f) => f.source === "publint");
  const replacements = analysis.findings.filter(
    (f) => f.source === "replacements",
  );

  if (analysis.findings.length === 0) {
    return (
      <div className="rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-3 text-sm text-emerald-700 dark:text-emerald-300">
        No project-level issues found.
        {analysis.warnings.length > 0 && (
          <Warnings warnings={analysis.warnings} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Summary summary={analysis.summary} />
      {publint.length > 0 && (
        <FindingGroup
          title="Publishing hygiene (publint)"
          findings={publint}
          postReveal={postReveal}
        />
      )}
      {replacements.length > 0 && (
        <FindingGroup
          title="Replacement opportunities"
          findings={replacements}
          postReveal={postReveal}
        />
      )}
      {analysis.warnings.length > 0 && (
        <Warnings warnings={analysis.warnings} />
      )}
    </div>
  );
};

const Summary: FC<{ summary: ProjectAnalysis["summary"] }> = ({ summary }) => {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Pill label={`${summary.total} total`} tone="neutral" />
      {summary.bySeverity.error > 0 && (
        <Pill label={`${summary.bySeverity.error} errors`} tone="error" />
      )}
      {summary.bySeverity.warning > 0 && (
        <Pill label={`${summary.bySeverity.warning} warnings`} tone="warning" />
      )}
      {summary.bySeverity.info > 0 && (
        <Pill label={`${summary.bySeverity.info} info`} tone="info" />
      )}
    </div>
  );
};

interface PillProps {
  label: string;
  tone: "neutral" | "error" | "warning" | "info";
}

const Pill: FC<PillProps> = ({ label, tone }) => {
  const palette: Record<PillProps["tone"], string> = {
    neutral:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    error: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded font-medium ${palette[tone]}`}>
      {label}
    </span>
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
  return (
    <section className="rounded border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
      <header className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {findings.length}
        </span>
      </header>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {findings.map((finding, index) => (
          <FindingRow
            key={`${finding.source}-${finding.code}-${index}`}
            finding={finding}
            postReveal={postReveal}
          />
        ))}
      </ul>
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
    postReveal(`file://${finding.file}`, finding.range);
  }, [finding, postReveal]);

  const documentationUrl =
    typeof finding.data?.documentationUrl === "string"
      ? finding.data.documentationUrl
      : undefined;

  return (
    <li className="px-3 py-2 flex items-start gap-2 text-sm">
      <SeverityIcon severity={finding.severity} />
      <div className="flex-1 min-w-0">
        <div className="text-slate-700 dark:text-slate-200 break-words">
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
          className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
        />
      );
    case "warning":
      return (
        <AlertTriangle
          size={14}
          className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
        />
      );
    case "info":
      return (
        <Info
          size={14}
          className="text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5"
        />
      );
    case "hint":
    default:
      return (
        <Lightbulb
          size={14}
          className="text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5"
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
