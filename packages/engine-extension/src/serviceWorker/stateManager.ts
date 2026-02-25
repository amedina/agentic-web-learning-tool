/**
 * External dependencies
 */
import type { NodeOutput } from '@google-awlt/engine-core';

/**
 * Internal dependencies
 */
import { type StatusUpdate } from '../types/messages';

/**
 * Global execution state for workflows.
 */
export interface GlobalWorkflowState {
  workflowId: string | null;
  workflowName: string | null;
  status: 'running' | 'completed' | 'failed' | 'idle';
  currentNodeId: string | null;
  startTime?: number;
  tabId?: number | null;
}

/**
 * Workflow State Manager
 *
 * Single source of truth for workflow execution status in the extension.
 * Manages state persistence and broadcasts updates to all listeners.
 */
export class WorkflowStateManager {
  private static STORAGE_KEY = 'awlt_active_workflow_state';
  private currentState: GlobalWorkflowState = {
    workflowId: null,
    workflowName: null,
    status: 'idle',
    currentNodeId: null,
    tabId: null,
  };
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadState();
  }

  /**
   * Load initial state from storage.
   */
  private async loadState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(
        WorkflowStateManager.STORAGE_KEY
      );
      if (result[WorkflowStateManager.STORAGE_KEY]) {
        this.currentState = result[
          WorkflowStateManager.STORAGE_KEY
        ] as GlobalWorkflowState;
      }
    } catch (error) {
      console.error('[Workflow] Failed to load state from storage:', error);
    }
  }

  /**
   * Save current state to storage.
   */
  private async saveState(): Promise<void> {
    try {
      await chrome.storage.local.set({
        [WorkflowStateManager.STORAGE_KEY]: this.currentState,
      });
    } catch (error) {
      console.error('[Workflow] Failed to save state to storage:', error);
    }
  }

  /**
   * Check if a workflow is currently running.
   */
  public isBusy(): boolean {
    return this.currentState.status === 'running';
  }

  /**
   * Get the current global state.
   */
  public getState(): GlobalWorkflowState {
    return { ...this.currentState };
  }

  /**
   * Start a new workflow execution.
   */
  public async initWorkflow(
    workflowId: string,
    workflowName: string,
    tabId?: number
  ): Promise<void> {
    if (this.timeoutId) clearTimeout(this.timeoutId);

    this.currentState = {
      workflowId,
      workflowName,
      status: 'running',
      currentNodeId: null,
      startTime: Date.now(),
      tabId: tabId ?? null,
    };
    await this.saveState();

    this.broadcast({
      type: 'WORKFLOW_STATUS_CHANGE',
      state: this.currentState,
    });
  }

  /**
   * Update node status.
   */
  public async updateNodeStatus(
    nodeId: string,
    status: 'running' | 'success' | 'error',
    output?: NodeOutput
  ): Promise<void> {
    if (this.currentState.status !== 'running') return;

    this.currentState.currentNodeId = nodeId;
    await this.saveState();

    // Broadcast global status change to sync UI
    this.broadcast({
      type: 'WORKFLOW_STATUS_CHANGE',
      state: this.currentState,
    });

    const update: StatusUpdate = {
      type: 'NODE_STATUS',
      workflowId: this.currentState.workflowId ?? undefined,
      nodeId,
      output: output ?? { status },
    };

    this.broadcast(update);
  }

  /**
   * Complete workflow execution.
   */
  public async finishWorkflow(
    success: boolean,
    context?: unknown
  ): Promise<void> {
    this.currentState.status = success ? 'completed' : 'failed';
    await this.saveState();

    if (success) {
      this.broadcast({
        type: 'WORKFLOW_COMPLETE',
        workflowId: this.currentState.workflowId ?? undefined,
        context: context as any,
      });
    } else {
      this.broadcast({
        type: 'WORKFLOW_ERROR',
        workflowId: this.currentState.workflowId ?? undefined,
        error: 'Workflow execution failed',
      });
    }

    this.timeoutId = setTimeout(this.reset, 5000);
  }

  /**
   * Reset the state to idle.
   */
  public async reset(): Promise<void> {
    this.currentState = {
      workflowId: null,
      workflowName: null,
      status: 'idle',
      currentNodeId: null,
      tabId: null,
    };
    await this.saveState();
    this.broadcast({
      type: 'WORKFLOW_STATUS_CHANGE',
      state: this.currentState,
    });
  }

  /**
   * Broadcast state changes to all listeners (sidepanel, options page, etc.)
   */
  private broadcast(message: StatusUpdate): void {
    chrome.runtime.sendMessage(message).catch(() => {
      // Ignore errors if no listeners are active
    });
  }
}

// Singleton instance
let stateManagerInstance: WorkflowStateManager | null = null;

/**
 * Get the singleton WorkflowStateManager instance.
 */
export function getWorkflowStateManager(): WorkflowStateManager {
  if (!stateManagerInstance) {
    stateManagerInstance = new WorkflowStateManager();
  }
  return stateManagerInstance;
}
