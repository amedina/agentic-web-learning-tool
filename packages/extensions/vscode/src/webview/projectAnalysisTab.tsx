/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState, type FC } from "react";

/**
 * Internal dependencies.
 */
import { AboutPanel } from "./projectAnalysis/aboutPanel";
import { Body } from "./projectAnalysis/body";
import { Header } from "./projectAnalysis/header";
import { StaleBanner } from "./projectAnalysis/staleBanner";
import { newRequestId } from "./projectAnalysis/helpers";
import type {
  PostCopyPrompt,
  PostReveal,
  PostSetupMcp,
  StaleState,
  Status,
} from "./projectAnalysis/types";
import type { ExtensionMessage, PackageJsonFile } from "./protocol";

interface ProjectAnalysisTabProps {
  activeFile: PackageJsonFile | null;
  postRunRequest: (requestId: string, packageJsonUri: string) => void;
  postCacheRequest: (requestId: string, packageJsonUri: string) => void;
  postReveal: PostReveal;
  postCopyPrompt: PostCopyPrompt;
  postSetupMcp: PostSetupMcp;
}

/**
 * Webview tab that runs project-level analysis (publint + circular
 * dependencies) on demand. Owns its own request/response state via the
 * window message channel; the parent only supplies callbacks for posting
 * the request and revealing a finding's source location.
 */
export const ProjectAnalysisTab: FC<ProjectAnalysisTabProps> = ({
  activeFile,
  postRunRequest,
  postCacheRequest,
  postReveal,
  postCopyPrompt,
  postSetupMcp,
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
  // re-mount). Reset the visible status synchronously *before* asking,
  // otherwise the previous project's findings stay onscreen until
  // the host's `cachedProjectAnalysis` response lands, and if the new
  // project has no cached result the host's `null` reply doesn't
  // touch state, so the wrong findings linger indefinitely. Survives
  // the webview-script-context reset VSCode does on visibility flips.
  //
  // Keyed on the file URI string, not the `activeFile` object. The host
  // rebuilds a fresh `activeFile` object on every `init` it posts, and an
  // `init` fires on routine workspace events, including the runner opening
  // the package.json as a run finishes. Depending on the object reference
  // reset an in-flight run back to "idle" on each such refresh, which
  // dropped the eventual `projectAnalysisResult` and left the spinner
  // stuck forever. The URI only changes when the user truly switches files.
  const activeFileUri = activeFile?.uri ?? null;
  useEffect(() => {
    setStatus({ kind: "idle" });
    setStale(null);
    if (!activeFileUri) {
      pendingCacheRequestIdRef.current = null;
      return;
    }
    const requestId = newRequestId();
    pendingCacheRequestIdRef.current = requestId;
    postCacheRequest(requestId, activeFileUri);
  }, [activeFileUri, postCacheRequest]);

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
      {showAbout && status.kind === "ready" && (
        <AboutPanel onClose={() => setShowAbout(false)} />
      )}
      {stale && status.kind === "ready" && (
        <StaleBanner
          changedFileDisplayPath={stale.changedFileDisplayPath}
          onRerun={handleRun}
        />
      )}
      <Body
        status={status}
        postReveal={postReveal}
        postCopyPrompt={postCopyPrompt}
        postSetupMcp={postSetupMcp}
      />
    </div>
  );
};
