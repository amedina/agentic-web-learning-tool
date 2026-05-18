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
  ArrowDown,
  ChevronDown,
  ChevronRight,
  CornerDownLeft,
  ExternalLink,
  HelpCircle,
  Info,
  Lightbulb,
  Loader2,
  Network,
  PlayCircle,
  RefreshCw,
  Repeat,
  Search,
  ShieldCheck,
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

/**
 * Which analyzer card is currently expanded. Only one is open at a
 * time — `none` means both are collapsed, which is the default state
 * after a run finishes (the stat tiles up top still surface the totals).
 */
type ExpandedSection = "none" | "publint" | "circular";

let nextRequestId = 0;
const newRequestId = (): string => `pa-${Date.now()}-${++nextRequestId}`;

/**
 * Webview tab that runs project-level analysis (publint + circular
 * dependencies) on demand. Owns its own request/response state via the
 * window message channel; the parent only supplies callbacks for posting
 * the request and revealing a finding's source location.
 */
/**
 * Tracks whether the displayed analysis is known to be out-of-date
 * because the host saw a change to `package.json`. We render the
 * existing findings dimmed with a "Re-run analysis" banner above them
 * rather than wiping the panel — losing previously-displayed
 * findings on every keystroke save is jarring and unhelpful.
 */
interface StaleState {
  changedFileDisplayPath: string;
}

export const ProjectAnalysisTab: FC<ProjectAnalysisTabProps> = ({
  activeFile,
  postRunRequest,
  postCacheRequest,
  postReveal,
}) => {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [stale, setStale] = useState<StaleState | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const statusRef = useRef(status);
  statusRef.current = status;
  const activeFileRef = useRef(activeFile);
  activeFileRef.current = activeFile;
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
          setStale(null);
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
        return;
      }
      if (data.type === "projectAnalysisStale") {
        // Only react when the change targets the project currently
        // surfaced in this tab — a save in another workspace folder
        // shouldn't flag this project's results as stale.
        const active = activeFileRef.current;
        if (!active || active.uri !== data.packageJsonUri) {
          return;
        }
        // Don't bother flagging staleness when the tab is empty.
        if (statusRef.current.kind !== "ready") {
          return;
        }
        setStale({ changedFileDisplayPath: data.changedFileDisplayPath });
      }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);

  // Ask the host for any cached result every time the active file
  // changes (including initial mount, dropdown switch, and tab
  // re-mount). Reset the visible status synchronously *before* asking
  // — otherwise the previous project's findings stay onscreen until
  // the host's `cachedProjectAnalysis` response lands, and if the new
  // project has no cached result the host's `null` reply doesn't
  // touch state, so the wrong findings linger indefinitely. Survives
  // the webview-script-context reset VSCode does on visibility flips.
  useEffect(() => {
    setStatus({ kind: "idle" });
    setStale(null);
    if (!activeFile) {
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
    setStale(null);
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
        showAbout={showAbout}
        onToggleAbout={() => setShowAbout((value) => !value)}
      />
      {showAbout && <AboutPanel onClose={() => setShowAbout(false)} />}
      {stale && status.kind === "ready" && (
        <StaleBanner
          changedFileDisplayPath={stale.changedFileDisplayPath}
          onRerun={handleRun}
        />
      )}
      <Body status={status} postReveal={postReveal} />
    </div>
  );
};

interface HeaderProps {
  status: Status;
  onRun: () => void;
  disabled: boolean;
  showAbout: boolean;
  onToggleAbout: () => void;
}

/**
 * Renders the run button, a help toggle, and a one-line status hint
 * above the body. The help toggle reveals the per-analyzer descriptions
 * that previously only showed in the idle state — handy after a run
 * has populated the body and the user wants a refresher on what each
 * check actually inspects.
 */
const Header: FC<HeaderProps> = ({
  status,
  onRun,
  disabled,
  showAbout,
  onToggleAbout,
}) => {
  const isReady = status.kind === "ready";
  const isRunning = status.kind === "running";
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {statusHint(status)}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 ${
            showAbout
              ? "bg-slate-100 dark:bg-slate-700"
              : "bg-slate-50 dark:bg-slate-800"
          }`}
          onClick={onToggleAbout}
          aria-label="About this analysis"
          title="About this analysis"
          aria-pressed={showAbout}
        >
          <HelpCircle size={12} />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onRun}
          disabled={disabled}
        >
          {isRunning ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isReady ? (
            <RefreshCw size={12} />
          ) : (
            <PlayCircle size={12} />
          )}
          {isReady ? "Re-run analysis" : "Run analysis"}
        </button>
      </div>
    </div>
  );
};

interface AboutPanelProps {
  onClose: () => void;
}

/**
 * Inline help panel describing both analyzers and why their findings
 * matter. Visible only when the user clicks the help icon next to the
 * run button — kept compact so it doesn't push results offscreen.
 */
const AboutPanel: FC<AboutPanelProps> = ({ onClose }) => {
  return (
    <div className="rounded border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/40 p-3 text-xs text-slate-700 dark:text-slate-200">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-slate-800 dark:text-slate-100">
          About this analysis
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <X size={12} />
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        <div>
          <div className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
            <ShieldCheck size={12} />
            Publishing hygiene
            <span className="text-[10px] font-normal text-slate-500">
              (
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
          <div className="mt-0.5 text-slate-600 dark:text-slate-300">
            Catches mistakes that would break consumers of your package after
            it&apos;s published: incorrect{" "}
            <code className="font-mono">exports</code>, missing types, ESM/CJS
            mismatches, files missing from{" "}
            <code className="font-mono">files</code>, deprecated fields, etc.
            <span className="italic">
              {" "}
              Helps you ship a package that works for everyone.
            </span>
          </div>
        </div>
        <div>
          <div className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
            <Repeat size={12} />
            Circular dependencies
            <span className="text-[10px] font-normal text-slate-500">
              (
              <a
                href="https://github.com/pahen/madge"
                target="_blank"
                rel="noreferrer"
                className="underline-offset-2 hover:underline"
              >
                madge
              </a>
              )
            </span>
          </div>
          <div className="mt-0.5 text-slate-600 dark:text-slate-300">
            Detects import cycles in your source tree.
            <span className="italic">
              {" "}
              Cycles cause subtle runtime ordering bugs (undefined exports),
              break tree-shaking, and make refactors riskier. Each detected
              cycle includes a visual graph so you can spot the offending import
              edge at a glance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StaleBannerProps {
  changedFileDisplayPath: string;
  onRerun: () => void;
}

/**
 * Banner shown above the body when the host signals that the file
 * the most recent analysis was based on has changed since the run.
 * The body still renders the previous findings (dimmed visually by
 * the banner alone, no extra CSS gymnastics) so the user doesn't
 * lose context, but the call-to-action makes clear they need to
 * re-run before trusting the displayed numbers.
 */
const StaleBanner: FC<StaleBannerProps> = ({
  changedFileDisplayPath,
  onRerun,
}) => {
  return (
    <div className="flex items-start gap-2 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold">Results are out of date.</div>
        <div
          className="mt-0.5 text-amber-700 dark:text-amber-300 break-all"
          title={changedFileDisplayPath}
        >
          <code className="font-mono">{changedFileDisplayPath}</code> changed
          since the last run.
        </div>
      </div>
      <button
        type="button"
        onClick={onRerun}
        className="inline-flex items-center gap-1 rounded border border-amber-400 dark:border-amber-700 bg-amber-100 dark:bg-amber-900 px-2 py-1 text-xs font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800"
      >
        <RefreshCw size={12} />
        Re-run
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
 * Renders the per-source insight cards. The tab surfaces two analyzers:
 * publint (publishing-readiness) and madge (circular dependencies).
 * Both cards start collapsed so the user can see the headline counts;
 * clicking a stat tile or a card header expands that section and
 * collapses the other (only one open at a time).
 */
const Results: FC<ResultsProps> = ({ analysis, postReveal }) => {
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
const OverallSummary: FC<OverallSummaryProps> = ({
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

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  suffix: string;
  tone: "ok" | "warning";
  active: boolean;
  onClick: () => void;
}

const StatTile: FC<StatTileProps> = ({
  icon,
  label,
  count,
  suffix,
  tone,
  active,
  onClick,
}) => {
  const palette =
    tone === "ok"
      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/70"
      : "border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/70";
  const activeRing = active ? "ring-2 ring-sky-500 dark:ring-sky-400" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded border px-3 py-2 transition-colors ${palette} ${activeRing}`}
    >
      <div className="flex items-center gap-1 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-lg font-semibold leading-tight">
        {count}
        <span className="ml-1 text-xs font-normal opacity-80">{suffix}</span>
      </div>
    </button>
  );
};

interface PublintCardProps {
  findings: ProjectFinding[];
  postReveal: ProjectAnalysisTabProps["postReveal"];
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Collapsible card containing publint (publishing-readiness) findings,
 * a severity filter bar, and a paginated list. Default state is
 * collapsed; the parent decides when it's open.
 */
const PublintCard: FC<PublintCardProps> = ({
  findings,
  postReveal,
  expanded,
  onToggle,
}) => {
  const summary = useMemo(() => summariseSeverity(findings), [findings]);
  const [filters, setFilters] = useState<FilterState>({
    severity: "all",
    query: "",
  });

  const filtered = useMemo(
    () => filterFindings(findings, filters),
    [findings, filters],
  );
  const isFiltered = filters.severity !== "all" || filters.query.trim() !== "";

  return (
    <CollapsibleCard
      title="Publishing hygiene"
      subtitle={
        <span>
          powered by{" "}
          <a
            href="https://publint.dev"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            publint
          </a>
        </span>
      }
      icon={<ShieldCheck size={14} />}
      badge={findings.length}
      badgeTone={findings.length > 0 ? "warning" : "ok"}
      collapsed={!expanded}
      onToggle={onToggle}
    >
      {findings.length === 0 ? (
        <div className="px-3 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck size={14} />
          No publishing-readiness issues found.
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-3 py-3">
          <SeverityFilterBar
            summary={summary}
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
            <FindingList findings={filtered} postReveal={postReveal} />
          )}
        </div>
      )}
    </CollapsibleCard>
  );
};

interface CircularDependenciesCardProps {
  findings: ProjectFinding[];
  postReveal: ProjectAnalysisTabProps["postReveal"];
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Collapsible card containing circular-dependency findings. Each
 * finding is a single cycle, rendered with a chain of clickable file
 * pills plus an on-demand SVG cycle diagram. Includes a free-text
 * filter that matches against file paths.
 */
const CircularDependenciesCard: FC<CircularDependenciesCardProps> = ({
  findings,
  postReveal,
  expanded,
  onToggle,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
      return findings;
    }
    return findings.filter((finding) => {
      const haystack = [
        finding.message,
        finding.file ?? "",
        ...((finding.data?.cycleRelative as string[] | undefined) ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [findings, query]);

  return (
    <CollapsibleCard
      title="Circular dependencies"
      subtitle={
        <span>
          powered by{" "}
          <a
            href="https://github.com/pahen/madge"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            madge
          </a>
        </span>
      }
      icon={<Repeat size={14} />}
      badge={findings.length}
      badgeTone={findings.length > 0 ? "warning" : "ok"}
      collapsed={!expanded}
      onToggle={onToggle}
    >
      {findings.length === 0 ? (
        <div className="px-3 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck size={14} />
          No circular dependencies detected in your source tree.
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-3 py-3">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter cycles by file path…"
              className="w-full pl-7 pr-7 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
            {query.trim() !== "" && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {query.trim() !== "" && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filtered.length} of {findings.length}.
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-500 dark:text-slate-400">
              No cycles match the filter.
            </div>
          ) : (
            <CircularDependencyList
              findings={filtered}
              postReveal={postReveal}
            />
          )}
        </div>
      )}
    </CollapsibleCard>
  );
};

interface CollapsibleCardProps {
  title: string;
  subtitle?: React.ReactNode;
  icon: React.ReactNode;
  badge: number;
  badgeTone: "ok" | "warning";
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * Lightweight section card with a clickable header that toggles
 * visibility of its body. Shared between the Publishing and Circular
 * Dependencies cards so they have a consistent look.
 */
const CollapsibleCard: FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  badgeTone,
  collapsed,
  onToggle,
  children,
}) => {
  const badgePalette =
    badgeTone === "ok"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  return (
    <section className="rounded border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {collapsed ? (
            <ChevronRight
              size={14}
              className="text-slate-500 dark:text-slate-400 shrink-0"
            />
          ) : (
            <ChevronDown
              size={14}
              className="text-slate-500 dark:text-slate-400 shrink-0"
            />
          )}
          <span className="text-slate-600 dark:text-slate-300 shrink-0">
            {icon}
          </span>
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide whitespace-nowrap">
            {title}
          </h3>
          {subtitle && (
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 normal-case truncate">
              {subtitle}
            </span>
          )}
        </div>
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${badgePalette}`}
        >
          {badge}
        </span>
      </button>
      {!collapsed && (
        <div className="border-t border-slate-200 dark:border-slate-800">
          {children}
        </div>
      )}
    </section>
  );
};

interface PublintSummary {
  total: number;
  bySeverity: Record<FindingSeverity, number>;
}

/**
 * Tally of how many publint findings there are at each severity tier.
 */
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
 * Lists the two analyzers the tab surfaces (publint + madge) so the
 * user knows what "Run analysis" actually inspects.
 */
const IdleExplainer: FC = () => {
  return (
    <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300">
      <p>
        Click <span className="font-medium">Run analysis</span> to inspect this
        project. Read-only — never modifies files.
      </p>
      <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-900/30">
        <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <ShieldCheck size={14} />
          Publishing hygiene
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
      <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-900/30">
        <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Repeat size={14} />
          Circular dependencies
          <span className="text-xs font-normal text-slate-500">
            (powered by{" "}
            <a
              href="https://github.com/pahen/madge"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              madge
            </a>
            )
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Detects import cycles in your source tree (
          <code className="font-mono">src/</code>,{" "}
          <code className="font-mono">lib/</code>, or project root). Cycles
          cause subtle runtime ordering bugs and break tree-shaking.
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Results land here and in the Problems panel. Subsequent runs are manual
        — analysis never fires on save.
      </p>
    </div>
  );
};

interface SeverityFilterBarProps {
  summary: PublintSummary;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  filteredCount: number;
  isFiltered: boolean;
}

/**
 * Combined summary + filter bar for publint. Severity counts double as
 * toggleable filter chips: clicking "5 errors" narrows the list to
 * errors; clicking the active chip (or "total") clears the severity
 * filter. A free-text search input sits below.
 */
const SeverityFilterBar: FC<SeverityFilterBarProps> = ({
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

interface FindingListProps {
  findings: ProjectFinding[];
  postReveal: ProjectAnalysisTabProps["postReveal"];
}

/**
 * Paginated list of publint findings. Truncates to the first
 * `INITIAL_GROUP_LIMIT` entries; a "Show all" button reveals the rest.
 */
const FindingList: FC<FindingListProps> = ({ findings, postReveal }) => {
  const [showAll, setShowAll] = useState(false);
  const total = findings.length;
  const visible =
    showAll || total <= INITIAL_GROUP_LIMIT
      ? findings
      : findings.slice(0, INITIAL_GROUP_LIMIT);
  return (
    <div className="rounded border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
      <header className="flex items-center justify-end px-3 py-1.5 border-b border-slate-200 dark:border-slate-800">
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
    </div>
  );
};

interface CircularDependencyListProps {
  findings: ProjectFinding[];
  postReveal: ProjectAnalysisTabProps["postReveal"];
}

/**
 * Paginated list of circular-dependency findings. Each row renders the
 * cycle file pills, an on-demand SVG diagram, and "Open file" actions.
 */
const CircularDependencyList: FC<CircularDependencyListProps> = ({
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
    <div className="rounded border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30">
      <header className="flex items-center justify-end px-3 py-1.5 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {visible.length === total ? total : `${visible.length} of ${total}`}
        </span>
      </header>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {visible.map((finding, index) => (
          <CircularDependencyRow
            key={`${finding.code}-${index}`}
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
            Show all {total} cycles
          </button>
        </div>
      )}
    </div>
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

interface CircularDependencyRowProps {
  finding: ProjectFinding;
  postReveal: ProjectAnalysisTabProps["postReveal"];
}

/**
 * Renders one cycle as a list of pill-shaped truncated file names with
 * a per-pill tooltip showing the full path. An expandable section
 * reveals an SVG graph of the cycle, with the files arranged on a
 * circle and arrows showing the dependency direction.
 */
const CircularDependencyRow: FC<CircularDependencyRowProps> = ({
  finding,
  postReveal,
}) => {
  const cycleRelative =
    (finding.data?.cycleRelative as string[] | undefined) ?? [];
  const cycleAbsolute = (finding.data?.cycle as string[] | undefined) ?? [];
  const edges = (finding.data?.edges as CycleEdge[] | undefined) ?? [];
  const cycleLength =
    typeof finding.data?.cycleLength === "number"
      ? (finding.data.cycleLength as number)
      : cycleRelative.length;

  const [showGraph, setShowGraph] = useState(false);

  const handleOpenFirst = useCallback(() => {
    if (!finding.file) {
      return;
    }
    postReveal(finding.file);
  }, [finding, postReveal]);

  return (
    <li className="px-3 py-2 flex items-start gap-2 text-sm">
      <Repeat
        size={14}
        className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="text-slate-700 dark:text-slate-200 text-xs font-medium">
          Cycle of {cycleLength} {cycleLength === 1 ? "file" : "files"}
        </div>
        {cycleRelative.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1 min-w-0">
            {cycleRelative.map((entry, index) => {
              const absolute = cycleAbsolute[index];
              const edge = edges[index];
              return (
                <div
                  key={`${entry}-${index}`}
                  className="inline-flex items-center gap-1 max-w-full min-w-0"
                >
                  <FilePill
                    label={entry}
                    fullPath={absolute ?? entry}
                    onClick={() => {
                      if (absolute) {
                        postReveal(absolute);
                      }
                    }}
                  />
                  <ArrowWithSymbols edge={edge} />
                </div>
              );
            })}
            <FilePill
              label={cycleRelative[0]}
              fullPath={cycleAbsolute[0] ?? cycleRelative[0]}
              dimmed
              onClick={() => {
                const firstAbsolute = cycleAbsolute[0];
                if (firstAbsolute) {
                  postReveal(firstAbsolute);
                }
              }}
            />
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
            onClick={() => setShowGraph((value) => !value)}
            aria-pressed={showGraph}
          >
            <Network size={10} />
            {showGraph ? "Hide graph" : "Show graph"}
          </button>
          {finding.file && (
            <button
              type="button"
              className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
              onClick={handleOpenFirst}
            >
              Open first file
            </button>
          )}
          <a
            href="https://github.com/pahen/madge#readme"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
          >
            Docs
            <ExternalLink size={10} />
          </a>
        </div>
        {showGraph && (
          <CycleGraph
            files={cycleRelative}
            fullPaths={cycleAbsolute}
            edges={edges}
            onSelect={(index) => {
              const absolute = cycleAbsolute[index];
              if (absolute) {
                postReveal(absolute);
              }
            }}
          />
        )}
      </div>
    </li>
  );
};

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
const FilePill: FC<FilePillProps> = ({ label, fullPath, dimmed, onClick }) => {
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

/**
 * Shortens a file path for display by keeping just the last two
 * segments. Falls back to the full path for short ones so we don't
 * truncate trivial cases.
 */
function shortenPath(filePath: string): string {
  const segments = filePath.split(/[\\/]+/);
  if (segments.length <= 2) {
    return filePath;
  }
  return `…/${segments.slice(-2).join("/")}`;
}

/**
 * Per-edge metadata produced by the project-analyzer-core circular
 * dependency scanner. Mirrors `CycleEdge` from
 * `findCircularDependencies.ts`; duplicated here so the webview can
 * stay decoupled from the analyzer's exports.
 */
interface CycleEdge {
  fromIndex: number;
  toIndex: number;
  symbols: string[];
  isTypeOnly: boolean;
  isSideEffectOnly: boolean;
}

interface CycleGraphProps {
  files: string[];
  fullPaths: string[];
  edges: CycleEdge[];
  onSelect: (index: number) => void;
}

/**
 * Visualization of a single cycle as a clean vertical flow. Each file
 * is a full-width pill connected to the next by a downward arrow,
 * labelled "imports" so the direction of the dependency is explicit;
 * a final loop-back row closes the cycle by pointing at the first file
 * again. This style mirrors madge's CLI image output (a directed
 * top-to-bottom chain) and stays readable at any cycle length without
 * the overlaps a 2D circular layout suffers from in a narrow sidebar.
 */
const CycleGraph: FC<CycleGraphProps> = ({
  files,
  fullPaths,
  edges,
  onSelect,
}) => {
  if (files.length === 0) {
    return null;
  }
  const firstLabel = shortenPath(files[0]);
  const firstFullPath = fullPaths[0] ?? files[0];
  const loopBackEdge = edges[files.length - 1];

  return (
    <div className="mt-2 rounded border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold">
          Cycle graph
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          Click a node to open
        </span>
      </div>
      <div className="relative pl-3">
        <span
          aria-hidden="true"
          className="absolute left-0 top-3 bottom-3 border-l-2 border-dashed border-amber-400 dark:border-amber-700"
        />
        <ol className="flex flex-col gap-1.5">
          {files.map((file, index) => {
            const label = shortenPath(file);
            const fullPath = fullPaths[index] ?? file;
            const isLast = index === files.length - 1;
            const edge = edges[index];
            return (
              <li key={`${file}-${index}`} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  title={fullPath}
                  className="w-full text-left rounded-md border border-amber-400 dark:border-amber-700 bg-amber-100/80 dark:bg-amber-950/80 px-3 py-1.5 text-xs font-mono text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors break-all"
                >
                  {label}
                </button>
                {!isLast && <EdgeLabel edge={edge} variant="block" />}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="mt-2 flex flex-col gap-1 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-100/60 dark:bg-amber-950/60 px-3 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
        <div className="flex items-center gap-1.5">
          <CornerDownLeft
            size={12}
            className="shrink-0 -scale-y-100"
            aria-hidden="true"
          />
          <span className="min-w-0 break-all">
            loops back to{" "}
            <button
              type="button"
              className="font-mono underline-offset-2 hover:underline"
              onClick={() => onSelect(0)}
              title={firstFullPath}
            >
              {firstLabel}
            </button>
          </span>
        </div>
        {loopBackEdge && hasEdgeDetails(loopBackEdge) && (
          <div className="pl-[18px] text-[10px] italic text-amber-700 dark:text-amber-300">
            via {describeEdge(loopBackEdge)}
          </div>
        )}
      </div>
    </div>
  );
};

interface EdgeLabelProps {
  edge: CycleEdge | undefined;
  /** "inline" sits next to a pill chain; "block" stacks under a file row. */
  variant: "inline" | "block";
}

/**
 * Renders the symbols imported across one cycle edge. Falls back to a
 * plain "imports" arrow when the analyzer couldn't resolve the import
 * (e.g. the importer uses a path alias the resolver doesn't know
 * about, or the edge goes through a re-export chain).
 */
const EdgeLabel: FC<EdgeLabelProps> = ({ edge, variant }) => {
  const symbols = edge?.symbols ?? [];
  const hasSymbols = symbols.length > 0;
  const isTypeOnly = edge?.isTypeOnly ?? false;
  const isSideEffect = edge?.isSideEffectOnly ?? false;

  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-1 shrink-0 text-slate-400 dark:text-slate-500 max-w-full min-w-0">
        <span className="shrink-0">→</span>
        {hasSymbols ? (
          <span
            className="font-mono text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 break-all max-w-[180px] truncate"
            title={summariseSymbols(symbols, isTypeOnly, isSideEffect, false)}
          >
            {summariseSymbols(symbols, isTypeOnly, isSideEffect, true)}
          </span>
        ) : isSideEffect ? (
          <span className="text-[10px] italic text-slate-500">side-effect</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pl-1 text-amber-700 dark:text-amber-300">
      <ArrowDown size={12} className="shrink-0" />
      <span className="text-[10px] italic text-slate-500 dark:text-slate-400 shrink-0">
        imports
      </span>
      {hasSymbols && (
        <span
          className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 break-all"
          title={summariseSymbols(symbols, isTypeOnly, isSideEffect, false)}
        >
          {isTypeOnly && (
            <span className="text-sky-700 dark:text-sky-400 mr-1">type</span>
          )}
          {summariseSymbols(symbols, false, false, false)}
        </span>
      )}
      {!hasSymbols && isSideEffect && (
        <span className="text-[10px] italic text-slate-500 dark:text-slate-400">
          for side-effects
        </span>
      )}
    </div>
  );
};

/**
 * Inline arrow label used in the compact pill chain at the top of the
 * row. Defers all rendering to `EdgeLabel` in `inline` variant so the
 * two surfaces stay in sync.
 */
const ArrowWithSymbols: FC<{ edge: CycleEdge | undefined }> = ({ edge }) => {
  return <EdgeLabel edge={edge} variant="inline" />;
};

/** Returns true if the edge carries information worth showing in the UI. */
function hasEdgeDetails(edge: CycleEdge): boolean {
  return edge.symbols.length > 0 || edge.isSideEffectOnly;
}

/**
 * Renders the symbols imported across a cycle edge as either a short,
 * truncated chip (for the compact pill chain) or the full list (for
 * tooltips and the expanded graph view). Caps the inline form at
 * three symbols and appends "+N more" so long re-export barrels don't
 * blow out the row width.
 */
function summariseSymbols(
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
function describeEdge(edge: CycleEdge): string {
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
