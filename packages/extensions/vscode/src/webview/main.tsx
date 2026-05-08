/**
 * External dependencies.
 */
import { createRoot } from "react-dom/client";

/**
 * Internal dependencies.
 */
import { App } from "./App";
import { installVscodeThemeMirror } from "./themeAdapter";
import { VsCodeStatsClient } from "./vscodeStatsClient";

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState<T>(): T | undefined;
  setState<T>(state: T): void;
};

const vscodeApi = acquireVsCodeApi();
installVscodeThemeMirror();

const client = new VsCodeStatsClient(vscodeApi);

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <App
      client={client}
      onReady={() => vscodeApi.postMessage({ type: "ready" })}
      onOpenPackageJson={(uri) =>
        vscodeApi.postMessage({ type: "openPackageJson", uri })
      }
      onRefreshStats={() => vscodeApi.postMessage({ type: "refreshStats" })}
      onSetupMcp={() => vscodeApi.postMessage({ type: "setupMcp" })}
      onNotify={(level, message, dedupeKey) =>
        vscodeApi.postMessage({ type: "notify", level, message, dedupeKey })
      }
      onRunProjectAnalysis={(requestId, packageJsonUri) =>
        vscodeApi.postMessage({
          type: "runProjectAnalysis",
          requestId,
          packageJsonUri,
        })
      }
      onRevealFinding={(fileUri, range) =>
        vscodeApi.postMessage({ type: "revealFinding", fileUri, range })
      }
    />,
  );
}
