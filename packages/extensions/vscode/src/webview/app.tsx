/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { Loader2 } from "lucide-react";
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";
import {
  DependenciesTab,
  StatsClientProvider,
  type StatsClient,
} from "@agentic-web-labs/package-analyzer-ui";

/**
 * Internal dependencies.
 */
import { PackageJsonSwitcher } from "./packageJsonSwitcher";
import { ProjectAnalysisTab } from "./projectAnalysisTab";
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

type ActiveTab = "dependencies" | "project";

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
  const noopAddRef = useRef<(name: string) => void>(() => undefined);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const handle = (event: MessageEvent): void => {
      const data = event.data as ExtensionMessage | undefined;
      if (!data || typeof data !== "object" || !("type" in data)) {
        return;
      }
      if (data.type === "init") {
        setInitState({
          activeFile: data.activeFile,
          availableFiles: data.availableFiles,
          packageJsonDependencies: data.packageJsonDependencies,
          refreshKey: data.refreshKey ?? 0,
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
          onRefresh={onRefreshStats}
          onSetupMcp={onSetupMcp}
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
                  key={`${activeFile.uri}#${refreshKey}`}
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
            />
          </div>
        </div>
      </div>
    </StatsClientProvider>
  );
};

interface TabBarProps {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

/**
 * Two-tab strip below the package.json switcher. Switches between the
 * existing per-dep view and the new project-level analysis tab.
 */
const TabBar: FC<TabBarProps> = ({ activeTab, onChange }) => {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
      <TabButton
        label="Dependencies"
        isActive={activeTab === "dependencies"}
        onClick={() => onChange("dependencies")}
      />
      <TabButton
        label="Project Analysis"
        isActive={activeTab === "project"}
        onClick={() => onChange("project")}
      />
    </div>
  );
};

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      type="button"
      className={`px-3 py-2 border-b-2 -mb-px ${
        isActive
          ? "border-sky-500 text-slate-900 dark:text-slate-100"
          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
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
