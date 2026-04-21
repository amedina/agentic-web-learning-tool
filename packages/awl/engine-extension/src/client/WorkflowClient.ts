/**
 * External dependencies
 */
import type {
  WorkflowJSON,
  ExecutionContext,
  NodeOutput,
} from '@google-awlt/engine-core';

/**
 * Internal dependencies
 */
import {
  type RunWorkflowMessage,
  type CheckCapabilitiesMessage,
  type StatusUpdate,
  type StopWorkflowMessage,
  type GetGlobalStatusMessage,
} from '../types/messages';
import { type GlobalWorkflowState } from '../serviceWorker/stateManager';

/**
 * Callbacks for workflow execution events.
 */
export interface WorkflowClientCallbacks {
  onNodeStart?: (nodeId: string) => void;
  onNodeFinish?: (nodeId: string, output: NodeOutput) => void;
  onComplete?: (context: ExecutionContext) => void;
  onError?: (error: string) => void;
}

/**
 * Callback for global status updates.
 */
export type GlobalStatusCallback = (state: GlobalWorkflowState) => void;

/**
 * Workflow Client
 *
 * Client-side API for communicating with the service worker.
 * Used by the Options page and other UI contexts.
 */
export class WorkflowClient {
  private globalCallbacks: Set<GlobalStatusCallback> = new Set();
  private executionListeners: Set<WorkflowClientCallbacks> = new Set();
  private listening = false;

  /**
   * Subscribe to global workflow status updates (idle, running, etc.)
   */
  public subscribeToGlobalStatus(callback: GlobalStatusCallback): () => void {
    this.globalCallbacks.add(callback);
    this.startListening();

    this.getGlobalStatus().then((state) => {
      callback(state);
    });

    return () => {
      this.globalCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to global execution events (node progress, completion).
   */
  public subscribeToUpdates(callbacks: WorkflowClientCallbacks): () => void {
    this.executionListeners.add(callbacks);
    this.startListening();

    this.getGlobalStatus().then((state) => {
      if (state.status === 'running' && state.currentNodeId) {
        callbacks.onNodeStart?.(state.currentNodeId);
      }
    });

    return () => {
      this.executionListeners.delete(callbacks);
    };
  }

  /**
   * Get the current global workflow status.
   */
  public async getGlobalStatus(): Promise<GlobalWorkflowState> {
    const message: GetGlobalStatusMessage = {
      type: 'GET_GLOBAL_STATUS',
    };

    let response;
    try {
      response = (await chrome.runtime.sendMessage(message)) as {
        success: boolean;
        state: GlobalWorkflowState;
        error?: string;
      };
    } catch (error: any) {
      throw new Error(error.message);
    }

    if (!response?.success) {
      throw new Error(response?.error ?? 'Failed to get global status');
    }

    return response.state;
  }

  /**
   * Run a workflow.
   * @param workflow - The workflow JSON to execute
   * @param tabId - Optional target tab for DOM operations
   * @param callbacks - Optional callbacks for execution events
   * @returns Promise resolving to the execution context
   */
  public async runWorkflow(
    workflow: WorkflowJSON,
    tabId?: number,
    callbacks?: WorkflowClientCallbacks
  ): Promise<ExecutionContext> {
    let unsubscribe: (() => void) | undefined;

    if (callbacks) {
      const wrappedCallbacks: WorkflowClientCallbacks = {
        ...callbacks,
        onComplete: (ctx) => {
          callbacks.onComplete?.(ctx);
          unsubscribe?.();
        },
        onError: (err) => {
          callbacks.onError?.(err);
          unsubscribe?.();
        },
      };

      unsubscribe = this.subscribeToUpdates(wrappedCallbacks);
    }

    const message: RunWorkflowMessage = {
      type: 'RUN_WORKFLOW',
      workflow,
      tabId,
    };

    try {
      const response = await chrome.runtime.sendMessage(message);

      if (chrome.runtime.lastError) {
        unsubscribe?.();
        throw new Error(chrome.runtime.lastError.message);
      }

      if (!response?.success) {
        unsubscribe?.();
        throw new Error(response?.error ?? 'Workflow execution failed');
      }

      return response.context!;
    } catch (error) {
      unsubscribe?.();
      throw error;
    }
  }

  /**
   * Check if capabilities are available.
   * @param capabilities - Array of capability identifiers to check
   * @returns Map of capability to availability
   */
  public async checkCapabilities(
    capabilities: string[] | Record<string, unknown>
  ): Promise<Record<string, boolean>> {
    const message: CheckCapabilitiesMessage = {
      type: 'CHECK_CAPABILITIES',
      capabilities,
    };

    let response;
    try {
      response = await chrome.runtime.sendMessage(message);
    } catch (error: any) {
      throw new Error(error.message);
    }

    if (!response?.success) {
      throw new Error(response?.error ?? 'Capability check failed');
    }

    return response.results ?? {};
  }

  /**
   * Stop the currently running workflow.
   */
  public async stopWorkflow(): Promise<void> {
    const message: StopWorkflowMessage = {
      type: 'STOP_WORKFLOW',
    };

    let response;
    try {
      response = await chrome.runtime.sendMessage(message);
    } catch (error: any) {
      throw new Error(error.message);
    }

    if (!response?.success) {
      throw new Error(response?.error ?? 'Failed to stop workflow');
    }
  }

  /**
   * Start listening for status updates from the service worker.
   */
  private startListening(): void {
    if (this.listening) return;
    this.listening = true;

    chrome.runtime.onMessage.addListener(
      (message: StatusUpdate, _sender, sendResponse) => {
        switch (message.type) {
          case 'NODE_STATUS':
            if (message.output.status === 'running') {
              this.executionListeners.forEach((l) =>
                l.onNodeStart?.(message.nodeId)
              );
            } else {
              this.executionListeners.forEach((l) =>
                l.onNodeFinish?.(message.nodeId, message.output)
              );
            }
            break;

          case 'WORKFLOW_COMPLETE':
            this.executionListeners.forEach((l) =>
              l.onComplete?.(message.context)
            );
            break;

          case 'WORKFLOW_ERROR':
            this.executionListeners.forEach((l) => l.onError?.(message?.error));
            break;

          case 'WORKFLOW_STATUS_CHANGE':
            this.globalCallbacks.forEach((cb) => cb(message.state));
            break;

          default:
            return false;
        }

        try {
          sendResponse();
        } catch (error) {
          console.error('Error sending response:', error);
        }
      }
    );
  }
}

// Singleton instance
let clientInstance: WorkflowClient | null = null;

/**
 * Get the singleton WorkflowClient instance.
 */
export function getWorkflowClient(): WorkflowClient {
  if (!clientInstance) {
    clientInstance = new WorkflowClient();
  }
  return clientInstance;
}
