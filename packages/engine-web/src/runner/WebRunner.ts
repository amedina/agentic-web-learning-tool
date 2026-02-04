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
import { WebRuntime, type ExecutionCallbacks } from "../runtime/WebRuntime";

export class WebRunner {
  private runtime: WebRuntime;
  private engine: WorkflowEngine;
  private initialized = false;

  constructor() {
    this.runtime = new WebRuntime();
    this.engine = new WorkflowEngine(this.runtime);
  }

  private initialize(): void {
    if (this.initialized) return;

    registerBuiltinExecutors();
    this.initialized = true;
  }

  public async run(
    workflow: WorkflowJSON,
    callbacks?: ExecutionCallbacks,
  ): Promise<ExecutionContext> {
    this.initialize();

    if (callbacks) {
      this.runtime.setCallbacks(callbacks);
    }

    return this.engine.execute(workflow);
  }

  public stop(): void {
    this.engine.abort();
  }

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

let runnerInstance: WebRunner | null = null;

export function getWebRunner(): WebRunner {
  if (!runnerInstance) {
    runnerInstance = new WebRunner();
  }
  return runnerInstance;
}
