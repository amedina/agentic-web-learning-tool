/**
 * External dependencies
 */
import type { RuntimeInterface, NodeOutput } from '@google-awlt/engine-core';

/**
 * Internal dependencies
 */
import type {
  QueryDOMMessage,
  ShowAlertMessage,
  ReplaceDOMMessage,
  CopyToClipboardMessage,
  DownloadFileMessage,
  SpeakTextMessage,
  ShowTooltipMessage,
} from '../types/messages';

/**
 * Service Worker Runtime
 *
 * Implements RuntimeInterface for service worker context.
 * Communicates with content scripts for DOM operations.
 */
export interface ExecutionCallbacks {
  onNodeStart?: (nodeId: string) => void;
  onNodeFinish?: (nodeId: string, output: NodeOutput) => void;
  onError?: (error: Error) => void;
}

/**
 * Service Worker Runtime implementation.
 * Executes in the service worker context and communicates with content scripts.
 */
export class ServiceWorkerRuntime implements RuntimeInterface {
  private callbacks: ExecutionCallbacks = {};
  private targetTabId: number | null = null;

  /**
   * Set the target tab for content script communication.
   */
  public setTargetTab(tabId: number): void {
    this.targetTabId = tabId;
  }

  /**
   * Set callbacks for execution events.
   */
  public setCallbacks(callbacks: ExecutionCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Check if a capability is available.
   * Built-in AI APIs are checked in the service worker context.
   */
  async checkCapability(capability: string, options?: any): Promise<boolean> {
    try {
      switch (capability) {
        case 'promptApi': {
          let available = 'LanguageModel' in self;
          const status = await LanguageModel.availability();
          available = available && status !== 'unavailable';

          return available;
        }

        case 'writerApi': {
          let available = 'Writer' in self;
          const status = await Writer.availability();
          available = available && status !== 'unavailable';

          return available;
        }

        case 'rewriterApi': {
          let available = 'Rewriter' in self;
          const status = await Rewriter.availability();
          available = available && status !== 'unavailable';

          return available;
        }

        case 'summarizerApi': {
          let available = 'Summarizer' in self;
          const status = await Summarizer.availability();
          available = available && status !== 'unavailable';

          return available;
        }

        case 'translatorApi': {
          let available = 'Translator' in self;
          const status = await Translator.availability(options);
          available = available && status !== 'unavailable';

          return available;
        }

        case 'languageDetectorApi': {
          let available = 'LanguageDetector' in self;
          const status = await LanguageDetector.availability();
          available = available && status !== 'unavailable';

          return available;
        }

        case 'proofreaderApi': {
          let available = 'Proofreader' in self;
          const status = await Proofreader.availability();
          available = available && status !== 'unavailable';

          return available;
        }

        // JS tools are always available
        case 'staticInput':
        case 'domInput':
        case 'alertNotification':
        case 'condition':
          return true;

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a value from Chrome extension storage.
   */
  async getStorage(key: string): Promise<unknown> {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]);
      });
    });
  }

  /**
   * Set a value in Chrome extension storage.
   */
  async setStorage(key: string, value: unknown): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  }

  /**
   * Query the active page's DOM via content script.
   */
  async queryPage(
    selector: string,
    extract:
      | 'textContent'
      | 'innerText'
      | 'innerHTML'
      | 'value'
      | 'src'
      | 'href',
    isMultiple?: boolean
  ): Promise<string | string[]> {
    const tabId = await this.getTargetTabId();

    const message: QueryDOMMessage = {
      type: 'QUERY_DOM',
      selector,
      extract,
      isMultiple,
    };

    const response = await chrome.tabs.sendMessage(tabId, message);

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response.success) {
      throw new Error(response.error ?? 'DOM query failed');
    }

    return response.data;
  }

  /**
   * Show an alert via content script.
   */
  async showAlert(message: string) {
    const tabId = await this.getTargetTabId();

    const msg: ShowAlertMessage = {
      type: 'SHOW_ALERT',
      message,
    };

    console.log(message);

    const response = await chrome.tabs.sendMessage(tabId, msg);

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response.success) {
      throw new Error(response.error ?? 'Alert failed');
    }
  }

  /**
   * Replace DOM content via content script.
   */
  async replaceDOM(
    selector: string,
    content: string,
    isMultiple?: boolean
  ): Promise<void> {
    const tabId = await this.getTargetTabId();

    const message: ReplaceDOMMessage = {
      type: 'REPLACE_DOM',
      selector,
      content,
      isMultiple,
    };

    const response = await chrome.tabs.sendMessage(tabId, message);

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response.success) {
      throw new Error(response.error ?? 'Replace DOM failed');
    }
  }

  /**
   * Copy to clipboard via content script.
   */
  async copyToClipboard(text: string): Promise<void> {
    const tabId = await this.getTargetTabId();

    const message: CopyToClipboardMessage = {
      type: 'COPY_TO_CLIPBOARD',
      text,
    };

    const response = await chrome.tabs.sendMessage(tabId, message);

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response.success) {
      throw new Error(response.error ?? 'Copy to clipboard failed');
    }
  }

  /**
   * Download file via content script.
   */
  async downloadFile(filename: string, content: string): Promise<void> {
    const tabId = await this.getTargetTabId();

    const message: DownloadFileMessage = {
      type: 'DOWNLOAD_FILE',
      filename,
      content,
    };

    const response = await chrome.tabs.sendMessage(tabId, message);

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response.success) {
      throw new Error(response.error ?? 'Download file failed');
    }
  }

  /**
   * Speak text via content script.
   */
  async speakText(text: string): Promise<void> {
    const tabId = await this.getTargetTabId();

    const message: SpeakTextMessage = {
      type: 'SPEAK_TEXT',
      text,
    };

    const response = await chrome.tabs.sendMessage(tabId, message);

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response.success) {
      throw new Error(response.error ?? 'Speak text failed');
    }
  }

  /**
   * Show tooltip via content script.
   */
  async showTooltip(selector: string, content: string): Promise<void> {
    const tabId = await this.getTargetTabId();

    const message: ShowTooltipMessage = {
      type: 'SHOW_TOOLTIP',
      selector,
      content,
    };

    const response = await chrome.tabs.sendMessage(tabId, message);

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response.success) {
      throw new Error(response.error ?? 'Show tooltip failed');
    }
  }

  /**
   * Called when a node starts execution.
   */
  onNodeStart(nodeId: string): void {
    this.callbacks.onNodeStart?.(nodeId);
  }

  /**
   * Called when a node finishes execution.
   */
  onNodeFinish(nodeId: string, output: NodeOutput): void {
    this.callbacks.onNodeFinish?.(nodeId, output);
  }

  /**
   * Called when an error occurs.
   */
  onError(error: Error): void {
    this.callbacks.onError?.(error);
  }

  /**
   * Get the target tab ID for content script communication.
   */
  private async getTargetTabId(): Promise<number> {
    if (this.targetTabId !== null) {
      return this.targetTabId;
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (!activeTab?.id) {
      throw new Error('No active tab found');
    }

    return activeTab.id;
  }
}
