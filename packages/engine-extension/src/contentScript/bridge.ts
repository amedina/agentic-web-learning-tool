/**
 * Internal dependencies
 */
import type {
  ContentScriptMessage,
  ContentScriptResponse,
} from "../types/messages";

/**
 * Content Script Bridge
 *
 * Handles messages from the service worker and performs browser-related operations:
 * - DOM extraction
 * - Showing alerts
 * - Visual status updates
 */
export function initContentScriptBridge(): void {
  /**
   * Handle incoming messages from the service worker.
   */
  function handleMessage(
    message: ContentScriptMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ContentScriptResponse) => void
  ): boolean {
    switch (message.type) {
      case "QUERY_DOM":
        handleQueryDOM(message.selector, message.extract, sendResponse);
        return true;

      case "SHOW_ALERT":
        handleShowAlert(message.message, sendResponse);
        return true;

      case "UPDATE_NODE_STATUS":
        handleUpdateNodeStatus(message.nodeId, message.status, sendResponse);
        return true;

      case "CONTENT_SCRIPT_ACTIVE":
        handleContentScriptActive(message.targetTabId, sendResponse);
        return true;

      default:
        sendResponse({ success: false, error: "Unknown message type" });
        return false;
    }
  }

  /**
   * Query the DOM for content.
   */
  function handleQueryDOM(
    selector: string,
    extract: "textContent" | "innerText" | "innerHTML",
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    try {
      const elements = document.querySelectorAll(selector);

      if (!elements) {
        sendResponse({
          success: true,
          data: "",
        });
        return;
      }

      let data: string[] = [];
      for (const element of Array.from(elements))
        switch (extract) {
          case "textContent":
            data.push(element.textContent ?? "");
            break;
          case "innerText":
            data.push((element as HTMLElement).innerText ?? "");
            break;
          case "innerHTML":
            data.push(element.innerHTML ?? "");
            break;
          default:
            data.push(element.textContent ?? "");
        }

      sendResponse({ success: true, data: data.join(" ") });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }

  /**
   * Show an alert to the user.
   */
  function handleShowAlert(
    message: string,
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    try {
      window.alert(message);
      sendResponse({ success: true });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: errMessage });
    }
  }

  /**
   * Update node status visual feedback.
   * This can be extended to show visual overlays on the page.
   */
  function handleUpdateNodeStatus(
    nodeId: string,
    status: "running" | "success" | "error",
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    try {
      // Log for now - can be extended to show visual feedback
      console.log(`[Workflow] Node ${nodeId}: ${status}`);
      sendResponse({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }

  async function handleContentScriptActive(
    tabId: number,
    sendResponse: (response: ContentScriptResponse) => void
  ) {
    try {
      const currentTabIds = await chrome.tabs.query({});

      if (currentTabIds.some((tab) => tab.id === tabId)) {
        console.log("[Workflow] Content script is active");
        sendResponse({ success: true });
      }

      sendResponse({ success: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }

  chrome.runtime.onMessage.addListener(handleMessage);
  console.log("[Workflow] Content script bridge initialized");
}
