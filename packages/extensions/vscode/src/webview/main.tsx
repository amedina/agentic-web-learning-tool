/**
 * External dependencies.
 */
import { createRoot } from "react-dom/client";

/**
 * Internal dependencies.
 */
import { App } from "./app";
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
      onCopyToClipboard={(text, toast) =>
        vscodeApi.postMessage({ type: "copyToClipboard", text, toast })
      }
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
      onGetCachedProjectAnalysis={(requestId, packageJsonUri) =>
        vscodeApi.postMessage({
          type: "getCachedProjectAnalysis",
          requestId,
          packageJsonUri,
        })
      }
      onRevealFinding={(filePath, range) =>
        vscodeApi.postMessage({ type: "revealFinding", filePath, range })
      }
      onRunProjectHealth={(scope) =>
        vscodeApi.postMessage({ type: "runProjectHealth", scope })
      }
      onCancelProjectHealth={() =>
        vscodeApi.postMessage({ type: "cancelProjectHealth" })
      }
      onGetCachedProjectHealth={(requestId) =>
        vscodeApi.postMessage({ type: "getCachedProjectHealth", requestId })
      }
      onGetSuppressions={() =>
        vscodeApi.postMessage({ type: "getSuppressions" })
      }
      onMuteFinding={(target, reason) =>
        vscodeApi.postMessage({ type: "muteFinding", target, reason })
      }
      onUnmuteFinding={(target) =>
        vscodeApi.postMessage({ type: "unmuteFinding", target })
      }
      onGetProjectHealthSettings={() =>
        vscodeApi.postMessage({ type: "getProjectHealthSettings" })
      }
      onSetProjectHealthAutoRun={(enabled) =>
        vscodeApi.postMessage({ type: "setProjectHealthAutoRun", enabled })
      }
    />,
  );
}
