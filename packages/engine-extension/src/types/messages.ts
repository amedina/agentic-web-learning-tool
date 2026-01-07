/**
 * Message types for communication between extension components.
 * All messages are typed for easy identification and type safety.
 */

import type {
  WorkflowJSON,
  ExecutionContext,
  NodeOutput,
} from "@google-awlt/engine-core";

// Service Worker -> Content Script Messages

/**
 * Query DOM for content extraction.
 */
export interface QueryDOMMessage {
  type: "QUERY_DOM";
  selector: string;
  extract: "textContent" | "innerText" | "innerHTML" | "value" | "src" | "href";
  isMultiple?: boolean;
}

/**
 * Show an alert to the user.
 */
export interface ShowAlertMessage {
  type: "SHOW_ALERT";
  message: string;
}

/**
 * Update node execution status (for visual feedback).
 */
export interface UpdateNodeStatusMessage {
  type: "UPDATE_NODE_STATUS";
  nodeId: string;
  status: "running" | "success" | "error";
  data?: unknown;
  error?: string;
}

/**
 * Replace DOM content.
 */
export interface ReplaceDOMMessage {
  type: "REPLACE_DOM";
  selector: string;
  content: string;
  isMultiple?: boolean;
  index?: number;
}

/**
 * Copy text to clipboard.
 */
export interface CopyToClipboardMessage {
  type: "COPY_TO_CLIPBOARD";
  text: string;
}

/**
 * Trigger file download.
 */
export interface DownloadFileMessage {
  type: "DOWNLOAD_FILE";
  filename: string;
  content: string;
}

/**
 * Speak text (TTS).
 */
export interface SpeakTextMessage {
  type: "SPEAK_TEXT";
  text: string;
}

/**
 * Show tooltip on page.
 */
export interface ShowTooltipMessage {
  type: "SHOW_TOOLTIP";
  selector: string;
  content: string;
}

/**
 * Content script is active.
 */
export interface ContentScriptActiveMessage {
  type: "CONTENT_SCRIPT_ACTIVE";
  targetTabId: number;
}

/**
 * All messages that can be sent to the content script.
 */
export type ContentScriptMessage =
  | QueryDOMMessage
  | ShowAlertMessage
  | UpdateNodeStatusMessage
  | ContentScriptActiveMessage
  | ReplaceDOMMessage
  | CopyToClipboardMessage
  | DownloadFileMessage
  | SpeakTextMessage
  | ShowTooltipMessage;

// Options Page / UI -> Service Worker Messages

/**
 * Request to run a workflow.
 */
export interface RunWorkflowMessage {
  type: "RUN_WORKFLOW";
  workflow: WorkflowJSON;
  tabId?: number; // Target tab for content script operations
}

/**
 * Request to check capability availability.
 */
export interface CheckCapabilitiesMessage {
  type: "CHECK_CAPABILITIES";
  capabilities: string[] | Record<string, any>;
}

/**
 * Request to cancel a running workflow.
 */
/**
 * Request to stop the currently running workflow.
 */
export interface StopWorkflowMessage {
  type: "STOP_WORKFLOW";
}

/**
 * All messages that can be sent to the service worker.
 */
export type ServiceWorkerMessage =
  | RunWorkflowMessage
  | CheckCapabilitiesMessage
  | StopWorkflowMessage;

// Response Types

/**
 * Generic response from content script.
 */
export interface ContentScriptResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Response from running a workflow.
 */
export interface WorkflowResponse {
  success: boolean;
  context?: ExecutionContext;
  error?: string;
}

/**
 * Response from capability check.
 */
export interface CapabilitiesResponse {
  success: boolean;
  results?: Record<string, boolean>;
  error?: string;
}

/**
 * Node status update sent from service worker to UI.
 */
export interface NodeStatusUpdate {
  type: "NODE_STATUS";
  nodeId: string;
  output: NodeOutput;
}

/**
 * Workflow completion event.
 */
export interface WorkflowCompleteUpdate {
  type: "WORKFLOW_COMPLETE";
  context: ExecutionContext;
}

/**
 * Workflow error event.
 */
export interface WorkflowErrorUpdate {
  type: "WORKFLOW_ERROR";
  error: string;
}

/**
 * All status updates from service worker to UI.
 */
export type StatusUpdate =
  | NodeStatusUpdate
  | WorkflowCompleteUpdate
  | WorkflowErrorUpdate;
