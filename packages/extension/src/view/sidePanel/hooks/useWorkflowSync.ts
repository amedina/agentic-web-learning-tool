/**
 * External dependencies
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getWorkflowClient,
  type GlobalWorkflowState,
} from '@google-awlt/engine-extension';
import type { WorkflowJSON } from '@google-awlt/engine-core';

/**
 * useWorkflowSync Hook
 *
 * Synchronizes the UI with the global workflow execution state and provides centralized actions for running and stopping workflows.
 */
export function useWorkflowSync() {
  const [state, setState] = useState<GlobalWorkflowState>({
    workflowId: null,
    workflowName: null,
    status: 'idle',
    currentNodeId: null,
    tabId: null,
  });

  const [isStopping, setIsStopping] = useState(false);

  const updateState = useCallback((newState: GlobalWorkflowState) => {
    setState(newState);
    if (newState.status !== 'running') {
      setIsStopping(false);
    }
  }, []);

  useEffect(() => {
    const client = getWorkflowClient();

    // Subscribe to updates
    const unsubscribe = client.subscribeToGlobalStatus(updateState);

    return () => {
      unsubscribe();
    };
  }, [updateState]);

  const runWorkflow = useCallback(
    async (workflow: WorkflowJSON, activeTabId?: number) => {
      if (state.status === 'running') return;

      try {
        const client = getWorkflowClient();
        await client.runWorkflow(workflow, activeTabId);
      } catch (error) {
        console.error('[Workflow] Failed to run workflow:', error);
      }
    },
    [state.status]
  );

  const stopWorkflow = useCallback(async () => {
    try {
      setIsStopping(true);
      await getWorkflowClient().stopWorkflow();
    } catch (error) {
      setIsStopping(false);
      console.error('[Workflow] Failed to stop workflow:', error);
    }
  }, []);

  return {
    ...state,
    isStopping,
    runWorkflow,
    stopWorkflow,
  };
}
