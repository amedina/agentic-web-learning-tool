/**
 * External dependencies
 */
import {
  WorkflowEngine,
  registerBuiltinExecutors,
  type WorkflowJSON,
  type ExecutionContext,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import { ServiceWorkerRuntime, type ExecutionCallbacks } from "./runtime";

/**
 * Workflow Runner
 *
 * Coordinates workflow execution in the service worker.
 */
export class WorkflowRunner {
  private runtime: ServiceWorkerRuntime;
  private engine: WorkflowEngine;
  private initialized = false;

  constructor() {
    this.runtime = new ServiceWorkerRuntime();
    this.engine = new WorkflowEngine(this.runtime);
  }

  /**
   * Initialize the runner by registering all built-in executors.
   */
  private initialize(): void {
    if (this.initialized) return;

    registerBuiltinExecutors();
    this.initialized = true;
  }

  /**
   * Run a workflow.
   * @param workflow - The workflow JSON to execute
   * @param tabId - Optional target tab for content script operations
   * @param callbacks - Optional callbacks for execution events
   * @returns The execution context with results
   */
  public async run(
    workflow: WorkflowJSON,
    tabId?: number,
    callbacks?: ExecutionCallbacks,
  ): Promise<ExecutionContext> {
    this.initialize();

    if (tabId) {
      this.runtime.setTargetTab(tabId);
    }

    if (callbacks) {
      this.runtime.setCallbacks(callbacks);
    }

    return this.engine.execute(workflow);
  }

  /**
   * Stop the currently running workflow.
   */
  public stop(): void {
    this.engine.abort();
  }

  /**
   * Check if capabilities are available.
   */
  public async checkCapabilities(
    capabilities: string[] | Record<string, any>,
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    if (Array.isArray(capabilities)) {
      for (const cap of capabilities) {
        results[cap] = await this.runtime.checkCapability(cap as any);
      }
    } else {
      for (const cap in capabilities) {
        results[cap] = await this.runtime.checkCapability(
          cap as any,
          capabilities[cap],
        );
      }
    }

    return results;
  }
}

// Singleton instance
let runnerInstance: WorkflowRunner | null = null;

/**
 * Get the singleton WorkflowRunner instance.
 */
export function getWorkflowRunner(): WorkflowRunner {
  if (!runnerInstance) {
    runnerInstance = new WorkflowRunner();
  }
  return runnerInstance;
}
