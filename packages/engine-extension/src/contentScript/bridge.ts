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
        handleQueryDOM(
          message.selector,
          message.extract,
          message.isMultiple,
          sendResponse
        );
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

      case "REPLACE_DOM":
        handleReplaceDOM(
          message.selector,
          message.content,
          message.isMultiple,
          sendResponse,
          message.index
        );
        return true;

      case "COPY_TO_CLIPBOARD":
        handleCopyToClipboard(message.text, sendResponse);
        return true;

      case "DOWNLOAD_FILE":
        handleDownloadFile(message.filename, message.content, sendResponse);
        return true;

      case "SPEAK_TEXT":
        handleSpeakText(message.text, sendResponse);
        return true;

      case "SHOW_TOOLTIP":
        handleShowTooltip(message.selector, message.content, sendResponse);
        return true;

      default:
        sendResponse({ success: false, error: "Unknown message type" });
        return false;
    }
  }

  chrome.runtime.onMessage.addListener(handleMessage);
  console.log("[Workflow] Content script bridge initialized");

  /**
   * Query the DOM for content.
   */
  function handleQueryDOM(
    selector: string,
    extract:
      | "textContent"
      | "innerText"
      | "innerHTML"
      | "value"
      | "src"
      | "href",
    isMultiple: boolean | undefined,
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    try {
      const elements = document.querySelectorAll(selector);

      if (!elements || elements.length === 0) {
        sendResponse({
          success: true,
          data: isMultiple ? [] : "",
        });
        return;
      }

      const extractValue = (element: Element): string => {
        switch (extract) {
          case "textContent":
            return element.textContent ?? "";
          case "innerText":
            return (element as HTMLElement).innerText ?? "";
          case "innerHTML":
            return element.innerHTML ?? "";
          case "value":
            return (element as HTMLInputElement).value ?? "";
          case "src":
            return (element as HTMLImageElement).src ?? "";
          case "href":
            return (element as HTMLAnchorElement).href ?? "";
          default:
            return element.textContent ?? "";
        }
      };

      if (isMultiple) {
        const data = Array.from(elements).map(extractValue);
        sendResponse({ success: true, data });
      } else {
        const data = extractValue(elements[0]);
        sendResponse({ success: true, data });
      }
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

  /**
   * Replace DOM content.
   */
  function handleReplaceDOM(
    selector: string,
    content: string,
    isMultiple: boolean | undefined,
    sendResponse: (response: ContentScriptResponse) => void,
    index?: number
  ): void {
    try {
      if (typeof index === "number") {
        const elements = document.querySelectorAll(selector);
        if (!elements || elements.length <= index) {
          throw new Error(
            `No element found at index ${index} for selector: ${selector}`
          );
        }
        elements[index].textContent = content;
      } else if (isMultiple) {
        const elements = document.querySelectorAll(selector);
        if (!elements || elements.length === 0) {
          throw new Error(`No elements found for selector: ${selector}`);
        }
        elements.forEach((el) => {
          el.textContent = content;
        });
      } else {
        const element = document.querySelector(selector);
        if (!element) {
          throw new Error(`No element found for selector: ${selector}`);
        }
        element.textContent = content;
      }

      sendResponse({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }

  /**
   * Copy text to clipboard.
   */
  async function handleCopyToClipboard(
    text: string,
    sendResponse: (response: ContentScriptResponse) => void
  ): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      sendResponse({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }

  /**
   * Trigger file download.
   */
  function handleDownloadFile(
    filename: string,
    content: string,
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    try {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sendResponse({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }

  /**
   * Speak text (TTS).
   */
  function handleSpeakText(
    text: string,
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);

      sendResponse({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }

  /**
   * Show tooltip on page.
   */
  function handleShowTooltip(
    selector: string,
    content: string,
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    try {
      const elements = document.querySelectorAll(selector);
      if (!elements || elements.length === 0) {
        throw new Error(`No elements found for selector: ${selector}`);
      }

      const styleId = "awlt-tooltip-styles";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            @keyframes awlt-tooltip-slide-up {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes awlt-tooltip-slide-down {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `;
        document.head.appendChild(style);
      }

      elements.forEach((el) => {
        const tooltip = document.createElement("div");
        Object.assign(tooltip.style, {
          position: "absolute",
          background: "#09090b",
          border: "2px solid #27272a",
          borderRadius: "8px",
          color: "#e4e4e7",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: "13px",
          lineHeight: "1.5",
          zIndex: "2147483647",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          maxWidth: "320px",
          minWidth: "200px",
          pointerEvents: "auto",
        });

        const header = document.createElement("div");
        Object.assign(header.style, {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#18181b",
          borderBottom: "2px solid #27272a",
          borderRadius: "6px 6px 0 0",
        });

        const titleGroup = document.createElement("div");
        Object.assign(titleGroup.style, {
          display: "flex",
          alignItems: "center",
          gap: "8px",
        });

        const icon = document.createElement("div");
        icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #818cf8;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        titleGroup.appendChild(icon);

        const titleText = document.createElement("span");
        titleText.textContent = "Tooltip";
        Object.assign(titleText.style, {
          fontWeight: "600",
          fontSize: "12px",
          color: "#fafafa",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        });
        titleGroup.appendChild(titleText);
        header.appendChild(titleGroup);

        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        Object.assign(closeBtn.style, {
          background: "transparent",
          border: "none",
          color: "#71717a",
          cursor: "pointer",
          padding: "2px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        });
        closeBtn.onmouseenter = () => {
          closeBtn.style.background = "#27272a";
          closeBtn.style.color = "#f4f4f5";
        };
        closeBtn.onmouseleave = () => {
          closeBtn.style.background = "transparent";
          closeBtn.style.color = "#71717a";
        };
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          tooltip.remove();
        };
        header.appendChild(closeBtn);
        tooltip.appendChild(header);

        const body = document.createElement("div");
        Object.assign(body.style, {
          padding: "12px",
          fontSize: "13px",
          color: "#d4d4d8",
        });
        body.textContent = content;
        tooltip.appendChild(body);

        const rect = el.getBoundingClientRect();
        const tooltipHeight = 100;
        const spaceAbove = rect.top;
        const placeBelow = spaceAbove < tooltipHeight + 10;

        tooltip.style.animation = placeBelow
          ? "awlt-tooltip-slide-down 0.2s ease-out forwards"
          : "awlt-tooltip-slide-up 0.2s ease-out forwards";

        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        let top = rect.top + scrollY - 12;

        if (placeBelow) {
          top = rect.bottom + scrollY + 8;
        } else {
        }

        tooltip.style.visibility = "hidden";
        document.body.appendChild(tooltip);

        const tipRect = tooltip.getBoundingClientRect();
        if (!placeBelow) {
          top = rect.top + scrollY - tipRect.height - 8;
        }

        tooltip.style.top = `${Math.max(top, 0)}px`;
        tooltip.style.left = `${Math.max(rect.left + scrollX, 0)}px`;
        tooltip.style.visibility = "visible";
      });

      sendResponse({
        success: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }
}
