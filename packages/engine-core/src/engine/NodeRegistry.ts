/**
 * Internal dependencies
 */
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

/**
 * Function signature for node executors.
 * Each node type has an executor that processes its configuration and produces output.
 */
export type NodeExecutor = (
  config: Record<string, unknown>,
  runtime: RuntimeInterface,
  context: ExecutionContext
) => Promise<unknown>;

/**
 * Registry for node executors.
 * Maps node type strings to their corresponding executor functions.
 */
export class NodeRegistry {
  private static executors = new Map<string, NodeExecutor>();

  /**
   * Register an executor for a node type.
   * @param type - Node type identifier (e.g., 'promptApi', 'staticInput')
   * @param executor - Function that executes the node's logic
   */
  public static register(type: string, executor: NodeExecutor): void {
    this.executors.set(type, executor);
  }

  /**
   * Get the executor for a node type.
   * @param type - Node type identifier
   * @returns The executor function
   * @throws Error if no executor is registered for the type
   */
  public static get(type: string): NodeExecutor {
    const executor = this.executors.get(type);
    if (!executor) {
      throw new Error(`No executor registered for node type: ${type}`);
    }
    return executor;
  }

  /**
   * Check if an executor is registered for a node type.
   * @param type - Node type identifier
   * @returns True if an executor exists
   */
  public static has(type: string): boolean {
    return this.executors.has(type);
  }

  /**
   * Get all registered node types.
   * @returns Array of registered type identifiers
   */
  public static getRegisteredTypes(): string[] {
    return Array.from(this.executors.keys());
  }

  /**
   * Clear all registered executors.
   * Primarily used for testing.
   */
  public static clear(): void {
    this.executors.clear();
  }
}
