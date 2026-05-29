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
import { PackageJsonSwitcher } from "./packageJsonSwitcher";
import { ProjectAnalysisTab } from "./projectAnalysisTab";
import { TabBar, type ActiveTab } from "./tabBar";
import type {
  ExtensionMessage,
  PackageJsonDependenciesPayload,
  PackageJsonFile,
} from "./protocol";

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
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dependencies");
  const [initState, setInitState] = useState<{
    activeFile: PackageJsonFile | null;
    availableFiles: PackageJsonFile[];
    packageJsonDependencies: PackageJsonDependenciesPayload;
    refreshKey: number;
    prefetchedStats: Record<string, PackageStats | null>;
  } | null>(null);
  const [focusPackageName, setFocusPackageName] = useState<string | null>(null);
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
      } else if (data.type === "focusPackage") {
        setFocusPackageName(data.packageName);
      }
    };
    window.addEventListener("message", handle);
    onReadyRef.current();
    return () => window.removeEventListener("message", handle);
  }, []);

  useEffect(() => {
    if (!focusPackageName) {
      return;
    }
    // Two rAF ticks so the row has time to mount after deps arrive.
    const rafA = requestAnimationFrame(() => {
      const rafB = requestAnimationFrame(() => {
        focusRow(focusPackageName);
        cancelAnimationFrame(rafB);
      });
      cancelAnimationFrame(rafA);
    });
  }, [focusPackageName, initState?.packageJsonDependencies]);

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
      </div>
    </StatsClientProvider>
  );
};

/**
 * Locates the accordion trigger for the named package via its title
 * attribute, scrolls it into view, and clicks it open if it isn't
 * already. Falls back to a no-op if analyzer-ui's row markup ever
 * stops emitting the title attribute we rely on.
 */
function focusRow(packageName: string): void {
  const trigger = Array.from(
    document.querySelectorAll<HTMLElement>("[title]"),
  ).find((node) => node.getAttribute("title") === packageName);
  if (!trigger) {
    return;
  }
  trigger.scrollIntoView({ behavior: "smooth", block: "start" });
  const button = trigger.closest<HTMLElement>("button[data-state]");
  if (button && button.getAttribute("data-state") === "closed") {
    button.click();
  }
}
