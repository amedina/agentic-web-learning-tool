/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import {
  DependenciesTab,
  StatsClientProvider,
  type StatsClient,
} from "@agentic-web-labs/package-analyzer-ui";

/**
 * Internal dependencies.
 */
import type {
  ExtensionMessage,
  PackageJsonDependenciesPayload,
} from "./protocol";

interface AppProps {
  client: StatsClient;
  onReady: () => void;
}

const EMPTY_DEPS: PackageJsonDependenciesPayload = {
  dependencies: [],
  devDependencies: [],
  peerDependencies: [],
};

/**
 * Webview root. Listens for `init` (initial dependency list) and
 * `focusPackage` (jump-to-detail trigger) from the extension host,
 * then renders DependenciesTab from the analyzer-ui package.
 */
export const App: FC<AppProps> = ({ client, onReady }) => {
  const [packageJsonDependencies, setPackageJsonDependencies] =
    useState<PackageJsonDependenciesPayload | null>(null);
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
        setPackageJsonDependencies(data.packageJsonDependencies);
        if (data.focusPackageName) {
          setFocusPackageName(data.focusPackageName);
        }
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
  }, [focusPackageName, packageJsonDependencies]);

  const handleAddRecommendation = useCallback((name: string) => {
    noopAddRef.current(name);
  }, []);

  if (!packageJsonDependencies) {
    return (
      <div className="text-slate-500 dark:text-slate-400 p-4 text-sm">
        Loading dependencies…
      </div>
    );
  }

  const total =
    packageJsonDependencies.dependencies.length +
    packageJsonDependencies.devDependencies.length +
    packageJsonDependencies.peerDependencies.length;

  if (total === 0) {
    return (
      <div className="text-slate-500 dark:text-slate-400 p-4 text-sm">
        No dependencies found in this package.json.
      </div>
    );
  }

  return (
    <StatsClientProvider client={client}>
      <DependenciesTab
        packageJsonDependencies={packageJsonDependencies ?? EMPTY_DEPS}
        onAddRecommendationToCompare={handleAddRecommendation}
        comparisonBucketNames={EMPTY_SET}
        addingRecommendations={EMPTY_SET}
      />
    </StatsClientProvider>
  );
};

const EMPTY_SET: Set<string> = new Set();

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
