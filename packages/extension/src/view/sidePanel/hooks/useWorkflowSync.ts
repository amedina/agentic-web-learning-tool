/**
 * External dependencies
 */
import { useState, useEffect } from 'react';
import {
  getWorkflowClient,
  type GlobalWorkflowState,
} from '@google-awlt/engine-extension';

/**
 * useWorkflowSync Hook
 *
 * Synchronizes the UI with the global workflow execution state.
 */
export function useWorkflowSync() {
  const [state, setState] = useState<GlobalWorkflowState>({
    workflowId: null,
    workflowName: null,
    status: 'idle',
    currentNodeId: null,
    tabId: null,
  });

  useEffect(() => {
    const client = getWorkflowClient();

    // Load initial state
    client
      .getGlobalStatus()
      .then((initialState) => {
        setState(initialState);
      })
      .catch((error) => {
        console.error('[Workflow] Failed to get initial global status:', error);
      });

    // Subscribe to updates
    const unsubscribe = client.subscribeToGlobalStatus((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const stopWorkflow = async () => {
    try {
      await getWorkflowClient().stopWorkflow();
    } catch (error) {
      console.error('[Workflow] Failed to stop workflow:', error);
    }
  };

  return {
    ...state,
    stopWorkflow,
  };
}
