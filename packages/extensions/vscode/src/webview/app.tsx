/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { Loader2 } from "lucide-react";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";
import {
  DependenciesTab,
  StatsClientProvider,
  clearDependencyStatsCache,
  type StatsClient,
} from "@agentic-web-labs/package-analyzer-ui";

/**
 * Internal dependencies.
 */
import { GithubSignInBanner } from "./githubSignInBanner";
import { PackageJsonSwitcher } from "./packageJsonSwitcher";
import { newRequestId } from "./projectAnalysis/helpers";
import { ProjectAnalysisTab } from "./projectAnalysisTab";
import { ProjectHealthView } from "./projectHealth/projectHealthView";
import { TabBar, type ActiveTab } from "./tabBar";
import { ViewModeToggle, type ViewMode } from "./viewModeToggle";
import type {
  ExtensionMessage,
  PackageJsonDependenciesPayload,
  PackageJsonFile,
} from "./protocol";
import {
  isTerminalPhase,
  type MuteTarget,
  type ProjectHealthReport,
  type ProjectHealthScope,
  type SuppressionEntry,
} from "../projectHealth/types";

interface AppProps {
  client: StatsClient;
  onReady: () => void;
  onOpenPackageJson: (uri: string) => void;
  onRefreshStats: () => void;
  onSetupMcp: () => void;
  onCopyToClipboard: (text: string, toast?: string) => void;
  onNotify: (
    level: "info" | "warning" | "error",
    message: string,
    dedupeKey?: string,
  ) => void;
  onRunProjectAnalysis: (requestId: string, packageJsonUri: string) => void;
  onGetCachedProjectAnalysis: (
    requestId: string,
    packageJsonUri: string,
  ) => void;
  onRevealFinding: (
    filePath: string,
    range?: {
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
    },
  ) => void;
  onRunProjectHealth: (scope: ProjectHealthScope) => void;
  onCancelProjectHealth: () => void;
  onGetCachedProjectHealth: (requestId: string) => void;
  onGetSuppressions: () => void;
  onMuteFinding: (target: MuteTarget, reason?: string) => void;
  onUnmuteFinding: (target: MuteTarget) => void;
  onGetProjectHealthSettings: () => void;
  onSetProjectHealthAutoRun: (enabled: boolean) => void;
  onGetGithubAuthState: () => void;
  onSignInToGitHub: () => void;
}

const EMPTY_DEPS: PackageJsonDependenciesPayload = {
  dependencies: [],
  devDependencies: [],
  peerDependencies: [],
};

const EMPTY_SET: Set<string> = new Set();

/**
 * Webview root. Listens for `init` (active file + available files +
 * dependency lists) and `focusPackage` (jump-to-detail trigger) from
 * the extension host, then renders the file switcher on top and
 * DependenciesTab below when an active file is selected.
 */
export const App: FC<AppProps> = ({
  client,
  onReady,
  onOpenPackageJson,
  onRefreshStats,
  onSetupMcp,
  onCopyToClipboard,
  onNotify,
  onRunProjectAnalysis,
  onGetCachedProjectAnalysis,
  onRevealFinding,
  onRunProjectHealth,
  onCancelProjectHealth,
  onGetCachedProjectHealth,
  onGetSuppressions,
  onMuteFinding,
  onUnmuteFinding,
  onGetProjectHealthSettings,
  onSetProjectHealthAutoRun,
  onGetGithubAuthState,
  onSignInToGitHub,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("package");
  const [projectHealthReport, setProjectHealthReport] =
    useState<ProjectHealthReport | null>(null);
  // The scope currently running (set optimistically on click, cleared
  // when a terminal report arrives), or null when idle.
  const [runningScope, setRunningScope] = useState<ProjectHealthScope | null>(
    null,
  );
  const [suppressions, setSuppressions] = useState<SuppressionEntry[]>([]);
  // Mirrors npmAdvisor.projectHealth.autoRun; drives the in-panel toggle
  // on the Dependencies tab. Seeded from the host on mount and kept in
  // sync via `projectHealthSettings` messages. Initialized to the "daily"
  // default so the collapsed toggle reads "On" before the host replies.
  const [autoRunDaily, setAutoRunDaily] = useState(true);
  // GitHub sign-in state, used to show the rate-limit sign-in banner. null
  // until the host replies; the banner only renders when this is explicitly
  // false, so there is no flash before the state is known.
  const [githubSignedIn, setGithubSignedIn] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dependencies");
  // Bumped on every `navigateToProjectHealth` request (e.g. the daily
  // notification's "Show Project Health" action) and used as part of
  // ProjectHealthView's `key` so it remounts on its default Dependencies
  // sub-tab. This guarantees the panel lands on Dependencies even when it
  // was already open on the "Project Analysis" sub-tab.
  const [projectHealthNavSeq, setProjectHealthNavSeq] = useState(0);
  const [initState, setInitState] = useState<{
    activeFile: PackageJsonFile | null;
    availableFiles: PackageJsonFile[];
    packageJsonDependencies: PackageJsonDependenciesPayload;
    refreshKey: number;
    prefetchedStats: Record<string, PackageStats | null>;
  } | null>(null);
  const [focusPackageName, setFocusPackageName] = useState<string | null>(null);
  // Bumped on every focus request so re-triggering "Show full insights"
  // for the same package re-runs the scroll effect (a repeat name alone
  // would not change state and the effect would not re-fire).
  const [focusTick, setFocusTick] = useState(0);
  // Drives the refresh-button spinner. Set true on click, cleared when the
  // host responds with a new init (i.e. cache.clearAll has completed and
  // the new dependency payload is in hand).
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Bumped on every refresh click so DependenciesTab remounts immediately
  // (before the host round-trip completes) and the rows visibly snap back
  // to their skeleton state. Without this, the click→new-init turnaround
  // can be too fast to perceive and the refresh feels like a no-op.
  const [localRefreshTick, setLocalRefreshTick] = useState(0);
  const noopAddRef = useRef<(name: string) => void>(() => undefined);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onGetCachedProjectHealthRef = useRef(onGetCachedProjectHealth);
  onGetCachedProjectHealthRef.current = onGetCachedProjectHealth;
  const onGetSuppressionsRef = useRef(onGetSuppressions);
  onGetSuppressionsRef.current = onGetSuppressions;
  const onGetProjectHealthSettingsRef = useRef(onGetProjectHealthSettings);
  onGetProjectHealthSettingsRef.current = onGetProjectHealthSettings;
  const onGetGithubAuthStateRef = useRef(onGetGithubAuthState);
  onGetGithubAuthStateRef.current = onGetGithubAuthState;
  const pendingHealthCacheRequestIdRef = useRef<string | null>(null);
  // Tracks the refreshKey from the previous init so we can detect a host-side
  // cache wipe and drop useDependencyStats's module-level cache before the
  // key-bumped DependenciesTab remounts. Without this, the remount re-seeds
  // each row from the stale cache and the refresh appears to do nothing.
  const lastRefreshKeyRef = useRef<number | null>(null);

  useEffect(() => {
    const handle = (event: MessageEvent): void => {
      const data = event.data as ExtensionMessage | undefined;
      if (!data || typeof data !== "object" || !("type" in data)) {
        return;
      }
      if (data.type === "init") {
        const incomingRefreshKey = data.refreshKey ?? 0;
        if (
          lastRefreshKeyRef.current !== null &&
          lastRefreshKeyRef.current !== incomingRefreshKey
        ) {
          clearDependencyStatsCache();
          setIsRefreshing(false);
        }
        lastRefreshKeyRef.current = incomingRefreshKey;
        setInitState({
          activeFile: data.activeFile,
          availableFiles: data.availableFiles,
          packageJsonDependencies: data.packageJsonDependencies,
          refreshKey: incomingRefreshKey,
          prefetchedStats: data.prefetchedStats ?? {},
        });
        // Sync focus to whatever the host sent — including null. A plain
        // refresh / file-switch init has no focusPackageName, and without
        // this clear the previously-focused row would re-scroll into view
        // every time its file is reactivated (because the second effect
        // re-runs on each new packageJsonDependencies object reference).
        setFocusPackageName(data.focusPackageName ?? null);
        // A focus request (e.g. "Show full insights" from the hover) only
        // makes sense in the per-package Dependencies view, so switch
        // both the mode and the inner tab back to it before scrolling.
        if (data.focusPackageName) {
          setViewMode("package");
          setActiveTab("dependencies");
          setFocusTick((tick) => tick + 1);
        }
      } else if (data.type === "focusPackage") {
        setViewMode("package");
        setActiveTab("dependencies");
        setFocusPackageName(data.packageName);
        setFocusTick((tick) => tick + 1);
      } else if (data.type === "projectHealth") {
        // Streamed progress + the terminal snapshot for a workspace run.
        setProjectHealthReport(data.report);
        if (isTerminalPhase(data.report.phase)) {
          setRunningScope(null);
        }
      } else if (data.type === "cachedProjectHealth") {
        if (data.requestId !== pendingHealthCacheRequestIdRef.current) {
          return;
        }
        pendingHealthCacheRequestIdRef.current = null;
        if (data.report) {
          setProjectHealthReport(data.report);
        }
      } else if (data.type === "suppressions") {
        setSuppressions(data.entries);
      } else if (data.type === "projectHealthSettings") {
        setAutoRunDaily(data.autoRunDaily);
      } else if (data.type === "githubAuthState") {
        setGithubSignedIn(data.signedIn);
      } else if (data.type === "navigateToProjectHealth") {
        // Switch to the workspace-wide Project Health view and bump the
        // nav seq so ProjectHealthView remounts on its default
        // Dependencies sub-tab, regardless of the sub-tab it last showed.
        setViewMode("project");
        setProjectHealthNavSeq((seq) => seq + 1);
      }
    };
    window.addEventListener("message", handle);
    onReadyRef.current();
    // Ask the host for any persisted Project Health report so switching
    // to the Project Health view shows the last run instead of an empty
    // state. The reply is matched by requestId in the handler above.
    const healthRequestId = newRequestId();
    pendingHealthCacheRequestIdRef.current = healthRequestId;
    onGetCachedProjectHealthRef.current(healthRequestId);
    onGetSuppressionsRef.current();
    // Seed the auto-run toggle from the persisted setting.
    onGetProjectHealthSettingsRef.current();
    // Seed the GitHub sign-in banner state.
    onGetGithubAuthStateRef.current();
    return () => window.removeEventListener("message", handle);
  }, []);

  useEffect(() => {
    if (!focusPackageName) {
      return;
    }
    // Retry across a few frames so the scroll lands even when switching
    // from the Project Health view (DependenciesTab mounts a render or
    // two later, after the mode switch). Stops as soon as the row is
    // found, or after a short budget.
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tryFocus = (): void => {
      attempts += 1;
      const found = focusRow(focusPackageName);
      if (!found && attempts < 10) {
        timer = setTimeout(tryFocus, 120);
      }
    };
    const raf = requestAnimationFrame(tryFocus);
    return () => {
      cancelAnimationFrame(raf);
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [focusPackageName, focusTick, initState?.packageJsonDependencies]);

  const handleAddRecommendation = useCallback((name: string) => {
    noopAddRef.current(name);
  }, []);

  const handleSelectFile = useCallback(
    (file: PackageJsonFile) => {
      onOpenPackageJson(file.uri);
    },
    [onOpenPackageJson],
  );

  // Wraps the host-side refresh in an optimistic local reset: drop the
  // analyzer-ui module cache, strip the prefetchedStats snapshot from
  // initState, and bump localRefreshTick so DependenciesTab remounts now
  // with empty seed data — every row goes back to the skeleton state
  // before the host has even acknowledged the message. The button spinner
  // turns off when the new init arrives (see the message handler above).
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    clearDependencyStatsCache();
    setLocalRefreshTick((tick) => tick + 1);
    setInitState((previous) =>
      previous ? { ...previous, prefetchedStats: {} } : previous,
    );
    onRefreshStats();
  }, [onRefreshStats]);

  const handleRateLimited = useCallback(() => {
    onNotify(
      "warning",
      "NPM Advisor: GitHub API rate limit reached. Some package stats (stars, last commit, security advisories) may be missing until the limit resets.",
      "github-rate-limited",
    );
  }, [onNotify]);

  // Optimistically mark the scope as running so the header shows progress
  // immediately, before the first host snapshot lands. It is cleared
  // when a terminal `projectHealth` snapshot arrives.
  const handleRunProjectHealth = useCallback(
    (scope: ProjectHealthScope) => {
      setRunningScope(scope);
      onRunProjectHealth(scope);
    },
    [onRunProjectHealth],
  );

  const handleCancelProjectHealth = useCallback(() => {
    onCancelProjectHealth();
  }, [onCancelProjectHealth]);

  if (!initState) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-slate-500 dark:text-slate-400 text-sm h-full">
        <Loader2 size={20} className="animate-spin" />
        <span>Analyzing dependencies…</span>
      </div>
    );
  }

  const {
    activeFile,
    availableFiles,
    packageJsonDependencies,
    refreshKey,
    prefetchedStats,
  } = initState;
  const hasDependencies =
    packageJsonDependencies.dependencies.length +
      packageJsonDependencies.devDependencies.length +
      packageJsonDependencies.peerDependencies.length >
    0;

  return (
    <StatsClientProvider client={client}>
      <div className="flex flex-col h-full">
        {githubSignedIn === false ? (
          <GithubSignInBanner onSignIn={onSignInToGitHub} />
        ) : null}
        <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        {viewMode === "project" ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ProjectHealthView
              key={`project-health-${projectHealthNavSeq}`}
              report={projectHealthReport}
              runningScope={runningScope}
              onRun={handleRunProjectHealth}
              onCancel={handleCancelProjectHealth}
              onOpenPackageJson={onOpenPackageJson}
              suppressions={suppressions}
              onMute={onMuteFinding}
              onUnmute={onUnmuteFinding}
              autoRunDaily={autoRunDaily}
              onSetAutoRunDaily={onSetProjectHealthAutoRun}
              projectAnalysisActions={{
                postRunRequest: onRunProjectAnalysis,
                postCacheRequest: onGetCachedProjectAnalysis,
                postReveal: onRevealFinding,
                postCopyPrompt: onCopyToClipboard,
                postSetupMcp: onSetupMcp,
              }}
            />
          </div>
        ) : (
          <>
            <PackageJsonSwitcher
              activeFile={activeFile}
              availableFiles={availableFiles}
              onSelect={handleSelectFile}
              onRefresh={handleRefresh}
              onSetupMcp={onSetupMcp}
              isRefreshing={isRefreshing}
            />
            <TabBar activeTab={activeTab} onChange={setActiveTab} />
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/*
               * Both tab panels stay mounted and toggle via CSS so that
               * switching tabs doesn't blow away each tab's component-local
               * state (e.g. the in-progress / ready status of a project
               * analysis run). Host-side caching backstops state across
               * full webview re-mounts; this just makes intra-mount tab
               * switches feel instant and stateful.
               */}
              <div className={activeTab === "dependencies" ? "" : "hidden"}>
                {activeFile ? (
                  hasDependencies ? (
                    <DependenciesTab
                      key={`${activeFile.uri}#${refreshKey}#${localRefreshTick}`}
                      packageJsonDependencies={
                        packageJsonDependencies ?? EMPTY_DEPS
                      }
                      onAddRecommendationToCompare={handleAddRecommendation}
                      comparisonBucketNames={EMPTY_SET}
                      addingRecommendations={EMPTY_SET}
                      hideCompare
                      showFitness
                      forceVisiblePackageName={focusPackageName ?? undefined}
                      onRateLimited={handleRateLimited}
                      initialStatsByName={prefetchedStats}
                    />
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400 p-4 text-sm">
                      No dependencies found in this package.json.
                    </div>
                  )
                ) : null}
              </div>
              <div className={activeTab === "project" ? "" : "hidden"}>
                <ProjectAnalysisTab
                  activeFile={activeFile}
                  postRunRequest={onRunProjectAnalysis}
                  postCacheRequest={onGetCachedProjectAnalysis}
                  postReveal={onRevealFinding}
                  postCopyPrompt={onCopyToClipboard}
                  postSetupMcp={onSetupMcp}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </StatsClientProvider>
  );
};

/**
 * Locates the accordion trigger for the named package via its title
 * attribute, scrolls it into view, and clicks it open if it isn't
 * already. Returns true when the row was found (so the caller can stop
 * retrying), false otherwise (e.g. the row has not mounted yet).
 */
function focusRow(packageName: string): boolean {
  const trigger = Array.from(
    document.querySelectorAll<HTMLElement>("[title]"),
  ).find((node) => node.getAttribute("title") === packageName);
  if (!trigger) {
    return false;
  }
  // `offsetParent` is null when the element is not actually rendered
  // (e.g. it lives in the inactive, display:none tab). Scrolling then is a
  // no-op, so report "not found" and let the caller retry once the tab the
  // row belongs to has switched in.
  if (trigger.offsetParent === null) {
    return false;
  }
  trigger.scrollIntoView({ behavior: "smooth", block: "start" });
  const button = trigger.closest<HTMLElement>("button[data-state]");
  if (button && button.getAttribute("data-state") === "closed") {
    button.click();
  }
  return true;
}
