/**
 * External dependencies
 */
import {
  ExecutionContext,
  NodeOutput,
  WorkflowJSON,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import { WorkflowClient, WorkflowClientCallbacks } from "./WorkflowClient";

/**
 * Workflow Adapter
 *
 * Returns a callback function that can injected into the content script to run a workflow.
 */
export function workflowAdapter(workflowJson: WorkflowJSON, tabId: number) {
  return async () => {
    const callbacks: WorkflowClientCallbacks = {
      onNodeStart: (nodeId: string) => {
        console.log("Node started", nodeId);
      },
      onNodeFinish: (nodeId: string, output: NodeOutput) => {
        console.log("Node finished", nodeId, output);
      },
      onComplete: (context: ExecutionContext) => {
        console.log("Workflow completed", context);
      },
      onError: (error: string) => {
        console.error("Workflow error", error);
      },
    };

    const response = {
      content: {
        type: "text",
        text: "",
      },
      isError: false,
    };

    const client = new WorkflowClient();
    try {
      const executionContext = await client.runWorkflow(
        workflowJson,
        tabId,
        callbacks,
      );

      response.content.text = Object.entries(executionContext)
        .filter(([key]) => key.endsWith("end"))
        .map(([value]) => value)
        .join("\n");
    } catch (error: any) {
      response.content.text = error.message;
      response.isError = true;
    }

    return response;
  };
}
