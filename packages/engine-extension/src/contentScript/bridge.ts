/**
 * Internal dependencies
 */
import type {
  ContentScriptMessage,
  ContentScriptResponse,
} from '../types/messages';

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
      case 'QUERY_DOM':
        handleQueryDOM(
          message.selector,
          message.extract,
          message.isMultiple,
          sendResponse
        );
        return true;

      case 'SHOW_ALERT':
        handleShowAlert(message.message, sendResponse);
        return true;

      case 'UPDATE_NODE_STATUS':
        handleUpdateNodeStatus(message.nodeId, message.status, sendResponse);
        return true;

      case 'CONTENT_SCRIPT_ACTIVE':
        handleContentScriptActive(message.targetTabId, sendResponse);
        return true;

      case 'REPLACE_DOM':
        handleReplaceDOM(
          message.selector,
          message.content,
          message.isMultiple,
          sendResponse
        );
        return true;

      case 'COPY_TO_CLIPBOARD':
        handleCopyToClipboard(message.text, sendResponse);
        return true;

      case 'DOWNLOAD_FILE':
        handleDownloadFile(message.filename, message.content, sendResponse);
        return true;

      case 'SPEAK_TEXT':
        handleSpeakText(message.text, sendResponse);
        return true;

      case 'SHOW_TOOLTIP':
        handleShowTooltip(message.selector, message.content, sendResponse);
        return true;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
        return false;
    }
  }

  /**
   * Query the DOM for content.
   */
  function handleQueryDOM(
    selector: string,
    extract:
      | 'textContent'
      | 'innerText'
      | 'innerHTML'
      | 'value'
      | 'src'
      | 'href',
    isMultiple: boolean | undefined,
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    try {
      const elements = document.querySelectorAll(selector);

      if (!elements || elements.length === 0) {
        sendResponse({
          success: true,
          data: isMultiple ? [] : '',
        });
        return;
      }

      const extractValue = (element: Element): string => {
        switch (extract) {
          case 'textContent':
            return element.textContent ?? '';
          case 'innerText':
            return (element as HTMLElement).innerText ?? '';
          case 'innerHTML':
            return element.innerHTML ?? '';
          case 'value':
            return (element as HTMLInputElement).value ?? '';
          case 'src':
            return (element as HTMLImageElement).src ?? '';
          case 'href':
            return (element as HTMLAnchorElement).href ?? '';
          default:
            return element.textContent ?? '';
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
    status: 'running' | 'success' | 'error',
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
        console.log('[Workflow] Content script is active');
        sendResponse({ success: true });
      }

      sendResponse({ success: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }

  chrome.runtime.onMessage.addListener(handleMessage);
  console.log('[Workflow] Content script bridge initialized');

  /**
   * Replace DOM content.
   */
  function handleReplaceDOM(
    selector: string,
    content: string,
    isMultiple: boolean | undefined,
    sendResponse: (response: ContentScriptResponse) => void
  ): void {
    try {
      if (isMultiple) {
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
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
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

      elements.forEach((el) => {
        const tooltip = document.createElement('div');
        Object.assign(tooltip.style, {
          position: 'absolute',
          background: '#333',
          color: '#fff',
          padding: '5px 10px 5px 24px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: '10000',
          pointerEvents: 'auto',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        });

        const textSpan = document.createElement('span');
        textSpan.textContent = content;
        tooltip.appendChild(textSpan);

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        Object.assign(closeBtn.style, {
          position: 'absolute',
          left: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          padding: '0 4px',
          lineHeight: '1',
          opacity: '0.7',
        });

        closeBtn.onmouseenter = () => {
          closeBtn.style.opacity = '1';
        };
        closeBtn.onmouseleave = () => {
          closeBtn.style.opacity = '0.7';
        };

        closeBtn.onclick = (e) => {
          e.stopPropagation();
          if (document.body.contains(tooltip)) {
            document.body.removeChild(tooltip);
          }
        };
        tooltip.appendChild(closeBtn);

        const rect = el.getBoundingClientRect();
        tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
        tooltip.style.left = `${rect.left + window.scrollX}px`;

        document.body.appendChild(tooltip);
      });
      sendResponse({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    }
  }
}
