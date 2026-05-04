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
    />,
  );
}
