/**
 * External dependencies
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getWorkflowClient,
  type GlobalWorkflowState,
} from "@google-awlt/engine-extension";
import type { WorkflowJSON } from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import { useFlow, type FlowNodeType } from "../stateProviders";

/**
 * useWorkflowSync Hook
 *
 * Synchronizes the WorkflowCanvas UI with the global workflow execution state and provides centralized actions for running and stopping workflows.
 *
 * @param activeWorkflowId The ID of the currently active workflow in the canvas.
 * @param showToast Callback to show a toast message.
 */
const useWorkflowSync = (
  activeWorkflowId: string | null,
  showToast: (message: string, type: "success" | "error") => void,
) => {
  const { nodes, updateNodeStatus } = useFlow(({ state, actions }) => ({
    nodes: state.nodes,
    updateNodeStatus: actions.updateNodeStatus,
  }));

  const [globalState, setGlobalState] = useState<{
    isRunning: boolean;
    workflowId: string | null;
    workflowName: string | null;
  }>({
    isRunning: false,
    workflowId: null,
    workflowName: null,
  });

  const [isStopping, setIsStopping] = useState(false);
  const lastIsRunningRef = useRef(false);
  const currentWorkflowIdRef = useRef<string | null>(null);
  const runningNodeStatusesRef = useRef<
    Record<string, Record<string, "running" | "success" | "error" | undefined>>
  >({});

  const updateState = useCallback(
    (state: GlobalWorkflowState) => {
      const isRunning = state.status === "running";
      const wasRunning = lastIsRunningRef.current;
      lastIsRunningRef.current = isRunning;
      currentWorkflowIdRef.current = state.workflowId;

      setGlobalState({
        isRunning,
        workflowId: state.workflowId,
        workflowName: state.workflowName,
      });

      if (state.workflowId === activeWorkflowId) {
        // Reset statuses if we just started running (from here or anywhere else)
        if (isRunning && !wasRunning) {
          nodes.forEach((node: FlowNodeType) =>
            updateNodeStatus(node.id, undefined),
          );
        }

        // Apply persisted statuses if we are revisitting a running workflow
        if (isRunning && state.workflowId) {
          const persistedStatuses =
            runningNodeStatusesRef.current[state.workflowId];
          if (persistedStatuses) {
            Object.entries(persistedStatuses).forEach(([nodeId, status]) => {
              updateNodeStatus(nodeId, status);
            });
          }
        }

        if (isRunning && state.currentNodeId) {
          updateNodeStatus(state.currentNodeId, "running");
        }
      }

      if (state.workflowId === null) {
        nodes.forEach((node: FlowNodeType) =>
          updateNodeStatus(node.id, undefined),
        );
      }
    },
    [activeWorkflowId, nodes, updateNodeStatus],
  );

  useEffect(() => {
    const client = getWorkflowClient();

    // Subscribe to global status changes
    const unsubscribeStatus = client.subscribeToGlobalStatus(updateState);

    // Subscribe to node updates and completion
    const unsubscribeUpdates = client.subscribeToUpdates({
      onNodeStart: (nodeId) => {
        const currentWorkflowId = currentWorkflowIdRef.current;

        if (currentWorkflowId) {
          if (!runningNodeStatusesRef.current[currentWorkflowId]) {
            runningNodeStatusesRef.current[currentWorkflowId] = {};
          }
          runningNodeStatusesRef.current[currentWorkflowId][nodeId] = "running";
        }

        if (currentWorkflowId === activeWorkflowId) {
          updateNodeStatus(nodeId, "running");
        }
      },
      onNodeFinish: (nodeId, output) => {
        const currentWorkflowId = currentWorkflowIdRef.current;

        const status = output.status as any;
        if (currentWorkflowId) {
          if (!runningNodeStatusesRef.current[currentWorkflowId]) {
            runningNodeStatusesRef.current[currentWorkflowId] = {};
          }
          runningNodeStatusesRef.current[currentWorkflowId][nodeId] = status;
        }

        if (currentWorkflowId === activeWorkflowId) {
          updateNodeStatus(nodeId, status);
        }
      },
      onComplete: () => {
        setIsStopping(false);
        const currentWorkflowId = currentWorkflowIdRef.current;

        if (currentWorkflowId) {
          delete runningNodeStatusesRef.current[currentWorkflowId];
        }

        client.getGlobalStatus().then((state) => {
          updateState(state);

          if (state.workflowId === activeWorkflowId) {
            showToast("Workflow completed successfully!", "success");
          } else {
            showToast(
              `Workflow "${state.workflowName}" completed successfully!`,
              "success",
            );
          }
        });
      },
      onError: (error) => {
        setIsStopping(false);
        const currentWorkflowId = currentWorkflowIdRef.current;

        if (currentWorkflowId) {
          delete runningNodeStatusesRef.current[currentWorkflowId];
        }

        client.getGlobalStatus().then((state) => {
          updateState(state);
          showToast(`${error}`, "error");
        });
      },
    });

    return () => {
      unsubscribeStatus();
      unsubscribeUpdates();
    };
  }, [activeWorkflowId, showToast, updateState, updateNodeStatus]);

  const runWorkflow = useCallback(
    async (workflowData: WorkflowJSON, selectedTabId: number | null) => {
      if (globalState.isRunning) return;

      if (!selectedTabId) {
        showToast("Please select a tab to run on", "error");
        return;
      }

      // Reset statuses
      nodes.forEach((node: FlowNodeType) =>
        updateNodeStatus(node.id, undefined),
      );

      const client = getWorkflowClient();

      try {
        await client.runWorkflow(workflowData, selectedTabId);
      } catch (error) {
        setIsStopping(false);
        const msg = error instanceof Error ? error.message : String(error);
        showToast(`Failed to start workflow: ${msg}`, "error");
      }
    },
    [globalState.isRunning, nodes, showToast],
  );

  const stopWorkflow = useCallback(async () => {
    const client = getWorkflowClient();

    try {
      setIsStopping(true);
      await client.stopWorkflow();

      showToast("Stopping workflow...", "success");
    } catch (error) {
      setIsStopping(false);

      const msg = error instanceof Error ? error.message : String(error);
      showToast(`Failed to stop workflow: ${msg}`, "error");
    }
  }, [showToast]);

  return {
    ...globalState,
    isStopping,
    runWorkflow,
    stopWorkflow,
  };
};

export default useWorkflowSync;
