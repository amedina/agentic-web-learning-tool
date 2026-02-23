/**
 * External dependencies
 */
import { useEffect } from "react";
import {
  getWorkflowClient,
  type GlobalWorkflowState,
} from "@google-awlt/engine-extension";

/**
 * Internal dependencies
 */
import { useFlow } from "../stateProviders";

/**
 * useWorkflowSync Hook
 *
 * Synchronizes the WorkflowCanvas UI with the global workflow execution state.
 *
 * @param activeWorkflowId The ID of the currently active workflow in the canvas.
 * @param showToast Callback to show a toast message.
 */
const useWorkflowSync = (
  activeWorkflowId: string | null,
  showToast: (message: string, type: "success" | "error") => void,
) => {
  const { actions } = useFlow(({ actions }) => ({
    actions,
  }));

  useEffect(() => {
    const client = getWorkflowClient();

    // Initial sync
    client.getGlobalStatus().then((state: GlobalWorkflowState) => {
      if (state.workflowId === activeWorkflowId) {
        actions.setIsRunning(state.status === "running");
        if (state.status === "running" && state.currentNodeId) {
          actions.updateNodeStatus(state.currentNodeId, "running");
        }
      }
    });

    // Subscribe to global status changes
    const unsubscribeStatus = client.subscribeToGlobalStatus((state) => {
      if (state.workflowId === activeWorkflowId) {
        actions.setIsRunning(state.status === "running");

        if (state.status === "running" && state.currentNodeId) {
          actions.updateNodeStatus(state.currentNodeId, "running");
        }
      } else if (state.status === "running") {
        actions.setIsRunning(false);
      }
    });

    // Subscribe to node updates and completion
    const unsubscribeUpdates = client.subscribeToUpdates({
      onNodeStart: (nodeId) => {
        actions.updateNodeStatus(nodeId, "running");
      },
      onNodeFinish: (nodeId, output) => {
        actions.updateNodeStatus(nodeId, output.status as any);
      },
      onComplete: () => {
        actions.setIsRunning(false);
        client.getGlobalStatus().then((state) => {
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
        actions.setIsRunning(false);
        client.getGlobalStatus().then((state) => {
          if (state.workflowId === activeWorkflowId) {
            showToast(`Workflow failed: ${error}`, "error");
          } else {
            showToast(
              `Workflow "${state.workflowName}" failed: ${error}`,
              "error",
            );
          }
        });
      },
    });

    return () => {
      unsubscribeStatus();
      unsubscribeUpdates();
    };
  }, [activeWorkflowId, actions, showToast]);
};

export default useWorkflowSync;
