/**
 * Internal dependencies
 */
import type { NodeOutput } from "../types";

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
    extract: "textContent" | "innerText" | "innerHTML"
  ): Promise<string>;

  /**
   * Show an alert/notification to the user.
   * @param message - Message to display
   */
  showAlert(message: string): Promise<void>;

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
   * Callback invoked when an error occurs during execution.
   * @param error - The error that occurred
   */
  onError(error: Error): void;
}
