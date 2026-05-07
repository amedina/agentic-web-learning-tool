/**
 * External dependencies.
 */
import { createRoot } from "react-dom/client";

/**
 * Internal dependencies.
 */
import { McpSetupApp } from "./McpSetupApp";
import { installVscodeThemeMirror } from "../../webview/themeAdapter";

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState<T>(): T | undefined;
  setState<T>(state: T): void;
};

const vscodeApi = acquireVsCodeApi();
installVscodeThemeMirror();

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <McpSetupApp postMessage={(message) => vscodeApi.postMessage(message)} />,
  );
}
