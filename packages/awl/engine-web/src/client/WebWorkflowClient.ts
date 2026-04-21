/**
 * External dependencies
 */
import type { WorkflowJSON, ExecutionContext } from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import { getWebRunner } from "../runner/WebRunner";
import type { ExecutionCallbacks } from "../runtime/WebRuntime";

export class WebWorkflowClient {
  /**
   * Run a workflow in the webpage context.
   */
  public async runWorkflow(
    workflow: WorkflowJSON,
    callbacks?: ExecutionCallbacks,
  ): Promise<ExecutionContext> {
    const runner = getWebRunner();
    return runner.run(workflow, callbacks);
  }

  /**
   * Stop the currently running workflow.
   */
  public async stopWorkflow(): Promise<void> {
    const runner = getWebRunner();
    runner.stop();
  }

  /**
   * Check if capabilities are available in the webpage context.
   */
  public async checkCapabilities(
    capabilities: string[] | Record<string, any>,
  ): Promise<Record<string, boolean>> {
    const runner = getWebRunner();
    return runner.checkCapabilities(capabilities);
  }
}

/**
 * Initialize the client and attach it to the window object.
 */
export function initWebWorkflow(): WebWorkflowClient {
  const client = new WebWorkflowClient();
  console.log("[AWLT] Web Engine initialized at window.awltWorkflow");
  return client;
}
