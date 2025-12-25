/**
 * External dependencies
 */
import type {
  WorkflowJSON,
  ExecutionContext,
  NodeOutput,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import type {
  RunWorkflowMessage,
  CheckCapabilitiesMessage,
  StatusUpdate,
} from "../types/messages";

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
 * Workflow Client
 *
 * Client-side API for communicating with the service worker.
 * Used by the Options page and other UI contexts.
 */
export class WorkflowClient {
  private callbacks: WorkflowClientCallbacks = {};
  private listening = false;

  /**
   * Set callbacks for execution events.
   */
  public setCallbacks(callbacks: WorkflowClientCallbacks): void {
    this.callbacks = callbacks;
    this.startListening();
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
    if (callbacks) {
      this.setCallbacks(callbacks);
    }

    const message: RunWorkflowMessage = {
      type: "RUN_WORKFLOW",
      workflow,
      tabId,
    };

    const response = await chrome.runtime.sendMessage(message);

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response.success) {
      throw new Error(response.error ?? "Workflow execution failed");
    }

    return response.context!;
  }

  /**
   * Check if capabilities are available.
   * @param capabilities - Array of capability identifiers to check
   * @returns Map of capability to availability
   */
  public async checkCapabilities(
    capabilities: string[]
  ): Promise<Record<string, boolean>> {
    const message: CheckCapabilitiesMessage = {
      type: "CHECK_CAPABILITIES",
      capabilities,
    };

    const response = await chrome.runtime.sendMessage(message);

    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    if (!response.success) {
      throw new Error(response.error ?? "Capability check failed");
    }

    return response.results ?? {};
  }

  /**
   * Start listening for status updates from the service worker.
   */
  private startListening(): void {
    if (this.listening) return;
    this.listening = true;

    chrome.runtime.onMessage.addListener((message: StatusUpdate) => {
      switch (message.type) {
        case "NODE_STATUS":
          if (message.output.status === "running") {
            this.callbacks.onNodeStart?.(message.nodeId);
          } else {
            this.callbacks.onNodeFinish?.(message.nodeId, message.output);
          }
          break;

        case "WORKFLOW_COMPLETE":
          this.callbacks.onComplete?.(message.context);
          break;

        case "WORKFLOW_ERROR":
          this.callbacks.onError?.(message.error);
          break;
      }
    });
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
