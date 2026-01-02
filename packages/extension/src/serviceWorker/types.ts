/**
 * External dependencies
 */
import type { CallToolRequest, CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * External dependencies
 */
import type { MESSAGE_TYPES } from '../utils';

export interface TabToolInfo {
  port: chrome.runtime.Port;
  tools: Tool[];
  url?: string;
  domain?: string;
  timestamp: number;
  domainIndex?: number;
  isActive?: boolean;
}

/**
 * Types for request/response communication
 */
export interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (reason?: Error) => void;
}

export interface RequestResponse<T = CallToolRequest | Error> {
  success: boolean;
  payload: T;
}

export interface TabData {
  tools: Tool[];
  lastUpdated: number;
  url: string;
  tabId?: number;
  port?: chrome.runtime.Port;
  isClosed: boolean;
}

export type ContentScriptMessage =
  | { type: typeof MESSAGE_TYPES.REGISTER; tools: Tool[] }
  | { type: typeof MESSAGE_TYPES.UPDATE; tools: Tool[] }
  | { type: typeof MESSAGE_TYPES.RESULT; requestId: string; data: { success: boolean; payload: CallToolResult | Error } };
