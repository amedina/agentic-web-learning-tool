/**
 * Internal dependencies
 */
import type { NodeOutput } from '../types';

/**
 * Contract that adapters must implement to bridge environment-specific APIs.
 * This interface enables the engine to be portable across different environments
 * (Chrome Extension, standalone web app, Node.js, etc.)
 */
export interface RuntimeInterface {
  /**
   * Check if a specific capability is available in the runtime environment.
   * Used to verify Built-in AI API availability before execution.
   * @param capability - The capability identifier (e.g., 'promptApi', 'translatorApi')
   * @returns Promise resolving to true if capability is available
   */
  checkCapability(capability: string, options?: any): Promise<boolean>;

  /**
   * Retrieve a value from the runtime's storage.
   * @param key - Storage key
   * @returns Promise resolving to the stored value
   */
  getStorage(key: string): Promise<unknown>;

  /**
   * Store a value in the runtime's storage.
   * @param key - Storage key
   * @param value - Value to store
   */
  setStorage(key: string, value: unknown): Promise<void>;

  /**
   * Query the active page's DOM for content.
   * Used by DOM input nodes to extract text from web pages.
   * @param selector - CSS selector to query
   * @param extract - Type of content to extract
   * @returns Promise resolving to the extracted text content
   */
  queryPage(
    selector: string,
    extract:
      | 'textContent'
      | 'innerText'
      | 'innerHTML'
      | 'value'
      | 'src'
      | 'href',
    isMultiple?: boolean
  ): Promise<string | string[]>;

  /**
   * Show an alert/notification to the user.
   * @param message - Message to display
   */
  showAlert(message: string): Promise<void>;

  /**
   * Replace the content of elements matching the selector on the active page.
   * @param selector - CSS selector to target
   * @param content - New content (text or HTML)
   */
  replaceDOM(
    selector: string,
    content: string,
    isMultiple?: boolean,
    mode?: 'textContent' | 'innerText' | 'innerHTML' | 'value',
    index?: number
  ): Promise<void>;

  /**
   * Copy text to the user's clipboard.
   * @param text - Text to copy
   */
  copyToClipboard(text: string): Promise<void>;

  /**
   * Trigger a browser download of a text file.
   * @param filename - Name of the file (e.g., 'result.txt')
   * @param content - Content of the file
   */
  downloadFile(filename: string, content: string): Promise<void>;

  /**
   * Use Text-to-Speech to read text aloud.
   * @param text - Text to speak
   */
  speakText(text: string): Promise<void>;

  /**
   * Show a contextual tooltip next to matching elements on the page.
   * @param selector - CSS selector to target
   * @param content - Text to show in the tooltip
   */
  showTooltip(selector: string, content: string): Promise<void>;

  /**
   * Callback invoked when a node starts execution.
   * Used to update UI with running state.
   * @param nodeId - ID of the node that started
   */
  onNodeStart(nodeId: string): void;

  /**
   * Callback invoked when a node finishes execution.
   * Used to update UI with success/error state.
   * @param nodeId - ID of the node that finished
   * @param output - The node's output
   */
  onNodeFinish(nodeId: string, output: NodeOutput): void;

  /**
   * Wait for a user activation gesture (e.g., a click) on the page.
   * @returns Promise resolving when the user has interacted with the page.
   */
  waitForUserActivation(): Promise<void>;

  /**
   * Check if the user is currently "active" on the page (has recent interaction).
   * @returns Promise resolving to true if the user is active.
   */
  isUserActive(): Promise<boolean>;

  /**
   * Callback invoked when an error occurs during execution.
   * @param error - The error that occurred
   */
  onError(error: Error): void;
}
