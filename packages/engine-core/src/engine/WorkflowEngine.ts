/**
 * Internal dependencies
 */
import type {
  WorkflowJSON,
  ExecutionContext,
  NodeConfig,
  NodeOutput,
} from "../types";
import type { RuntimeInterface } from "../runtime";
import { WorkflowParser, type ParsedGraph } from "./WorkflowParser";
import { NodeRegistry } from "./NodeRegistry";

/**
 * Regular expression to match variable placeholders.
 * Matches patterns like {{steps.NODE_ID.data}} or {{steps.NODE_ID.error}}
 */
const VARIABLE_PATTERN = /\{\{steps\.([^.]+)\.(\w+)\}\}/g;

/**
 * Options for workflow execution.
 */
export interface ExecutionOptions {
  /** Whether to continue execution if a node fails */
  continueOnError?: boolean;
  /** Initial variables to inject into the context */
  initialVariables?: Record<string, unknown>;
}

/**
 * Main workflow execution engine.
 * Orchestrates the parsing, validation, and execution of workflow graphs.
 */
export class WorkflowEngine {
  private parser: WorkflowParser;
  private context!: ExecutionContext;
  private parsedGraph!: ParsedGraph;

  private runtime: RuntimeInterface;

  constructor(runtime: RuntimeInterface) {
    this.runtime = runtime;
    this.parser = new WorkflowParser();
    this.context = {
      workflowId: "",
      steps: {},
      status: "idle",
      variables: {},
    };
  }

  /**
   * Execute a workflow from its JSON representation.
   * @param json - The workflow JSON
   * @param options - Execution options
   * @returns The execution context with results from all nodes
   */
  public async execute(
    json: WorkflowJSON,
    options: ExecutionOptions = {}
  ): Promise<ExecutionContext> {
    try {
      this.parsedGraph = this.parser.parse(json);
      const requiredCaps = this.parser.getRequiredCapabilities(
        this.parsedGraph
      );
      await this.verifyCapabilities(requiredCaps);

      const executionPlan = this.parser.getExecutionPlan(this.parsedGraph);
      this.context = this.createContext(json.meta.id, options.initialVariables);

      const executedNodes = new Set<string>();

      for (const node of executionPlan) {
        if (executedNodes.has(node.id)) continue;
        await this.executeNode(node, executedNodes);
      }

      this.context.status = "completed";
      return this.context;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.runtime.onError(err);
      throw err;
    }
  }

  /**
   * Create initial execution context.
   */
  private createContext(
    workflowId: string,
    initialVariables?: Record<string, unknown>
  ): ExecutionContext {
    return {
      workflowId,
      steps: {},
      variables: initialVariables ?? {},
      status: "running",
    };
  }

  /**
   * Verify that all required capabilities are available.
   */
  private async verifyCapabilities(
    capabilities: Record<string, any>
  ): Promise<void> {
    for (const [cap, options] of Object.entries(capabilities)) {
      const available = await this.runtime.checkCapability(cap, options);
      if (!available) {
        throw new Error(
          `Required capability "${cap}" is not available in this environment`
        );
      }
    }
  }

  /**
   * Execute a single node.
   */
  private async executeNode(
    node: NodeConfig,
    executedNodes: Set<string>
  ): Promise<void> {
    if (executedNodes.has(node.id)) return;

    this.runtime.onNodeStart(node.id);
    this.context.steps[node.id] = { status: "running" };

    try {
      const inputData = this.getInputData(node.id);

      const configWithInput: Record<string, unknown> = {
        ...node.config,
        input: inputData["input"],
        inputs: inputData,
      };

      const resolvedConfig = this.resolveVariables(configWithInput, inputData);

      const executor = NodeRegistry.get(node.type);
      const result = await executor(
        resolvedConfig,
        this.runtime,
        this.context,
        (handle, input) => this.executeBranch(node.id, handle, input)
      );

      const output: NodeOutput = { status: "success", data: result };
      this.context.steps[node.id] = output;
      this.runtime.onNodeFinish(node.id, output);
      executedNodes.add(node.id);

      if (node.type === "loop") {
        const itemNodes = this.parser.getReachableNodes(
          this.parsedGraph,
          node.id,
          "item"
        );
        itemNodes.forEach((n) => executedNodes.add(n.id));
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const output: NodeOutput = { status: "error", error: error.message };
      this.context.steps[node.id] = output;
      this.runtime.onNodeFinish(node.id, output);
      executedNodes.add(node.id);
      throw error;
    }
  }

  /**
   * Execute a branch of the workflow.
   * This is used by executors (like Loop) to run sub-graphs.
   */
  private async executeBranch(
    nodeId: string,
    handle: string,
    input: unknown
  ): Promise<unknown> {
    const branchNodes = this.parser.getReachableNodes(
      this.parsedGraph,
      nodeId,
      handle
    );

    if (branchNodes.length === 0) return input;

    const branchExecutedNodes = new Set<string>();
    this.context.steps[nodeId] = { status: "success", data: input };
	
    let lastResult: unknown = input;

    for (const node of branchNodes) {
      await this.executeNode(node, branchExecutedNodes);
      lastResult = this.context.steps[node.id]?.data ?? lastResult;
    }

    return lastResult;
  }

  /**
   * Get aggregated input data from all nodes connected to this node's inputs.
   */
  private getInputData(nodeId: string): Record<string, unknown> {
    const inputNodes = this.parser.getInputNodes(this.parsedGraph, nodeId);
    const inputData: Record<string, unknown> = {};

    // In case of multiple inputs, we need to aggregate the data
    for (const inputNode of inputNodes) {
      const stepOutput = this.context.steps[inputNode.id];
      if (stepOutput?.status === "success" && stepOutput.data !== undefined) {
        inputData[inputNode.id] = stepOutput.data;
      }
    }

    if (inputNodes.length) {
      const singleInput = this.context.steps[inputNodes[0].id];
      if (singleInput?.status === "success") {
        inputData["input"] = singleInput.data;
      }
    }

    return inputData;
  }

  /**
   * Resolve variable placeholders in configuration.
   * Replaces {{steps.NODE_ID.data}} patterns with actual values.
   */
  private resolveVariables(
    config: Record<string, unknown>,
    inputData: Record<string, unknown>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(config)) {
      resolved[key] = this.resolveValue(value, inputData);
    }

    return resolved;
  }

  /**
   * Resolve a single value, handling nested objects and arrays.
   */
  private resolveValue(
    value: unknown,
    inputData: Record<string, unknown>
  ): unknown {
    if (typeof value === "string") {
      return this.resolveStringVariables(value, inputData);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item, inputData));
    }

    if (value !== null && typeof value === "object") {
      const resolved: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        resolved[k] = this.resolveValue(v, inputData);
      }
      return resolved;
    }

    return value;
  }

  /**
   * Resolve variable placeholders in a string value.
   */
  private resolveStringVariables(
    str: string,
    inputData: Record<string, unknown>
  ): string {
    return str.replace(VARIABLE_PATTERN, (match, nodeId, property) => {
      const stepOutput = this.context.steps[nodeId];

      if (!stepOutput) {
        // Check if it's in inputData directly
        if (inputData[nodeId] !== undefined) {
          return String(inputData[nodeId]);
        }
        console.warn(`Variable reference to unknown node: ${nodeId}`);
        return match;
      }

      if (property === "data") {
        return stepOutput.data !== undefined ? String(stepOutput.data) : "";
      }

      if (property === "error") {
        return stepOutput.error ?? "";
      }

      if (property === "status") {
        return stepOutput.status;
      }

      console.warn(`Unknown property "${property}" in variable reference`);
      return match;
    });
  }

  /**
   * Get the current execution context.
   */
  public getContext(): ExecutionContext {
    return this.context;
  }
}
