/**
 * Internal dependencies
 */
import type { WorkflowJSON, NodeConfig, EdgeConfig } from "../types";

/**
 * Parsed graph representation used internally by the engine.
 * Provides efficient lookup structures for graph traversal.
 */
export interface ParsedGraph {
  /** Map of node ID to node configuration */
  nodes: Map<string, NodeConfig>;
  /** Adjacency list: source node ID -> array of target connections */
  adjacencyList: Map<
    string,
    { target: string; sourceHandle?: string | null }[]
  >;
  /** Reverse adjacency list: target node ID -> array of source connections */
  reverseAdjacencyList: Map<
    string,
    { source: string; targetHandle?: string | null }[]
  >;
  /** In-degree count for each node (number of incoming edges) */
  inDegree: Map<string, number>;
  /** Original edges for reference */
  edges: EdgeConfig[];
}

/**
 * Node types that require Built-in AI API capabilities.
 */
const AI_API_NODE_TYPES = new Set([
  "promptApi",
  "writerApi",
  "rewriterApi",
  "proofreaderApi",
  "translatorApi",
  "languageDetectorApi",
  "summarizerApi",
]);

/**
 * Parser for workflow JSON.
 * Handles validation, graph construction, and execution planning.
 */
export class WorkflowParser {
  /**
   * Parse workflow JSON into an internal graph representation.
   * @param json - The workflow JSON from the UI
   * @returns Parsed graph with lookup structures
   */
  public parse(json: WorkflowJSON): ParsedGraph {
    this.validate(json);

    const nodes = new Map<string, NodeConfig>();
    const adjacencyList = new Map<
      string,
      { target: string; sourceHandle?: string | null }[]
    >();
    const reverseAdjacencyList = new Map<
      string,
      { source: string; targetHandle?: string | null }[]
    >();
    const inDegree = new Map<string, number>();

    // Initialize nodes
    for (const node of json.graph.nodes) {
      nodes.set(node.id, node);
      adjacencyList.set(node.id, []);
      reverseAdjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    // Build adjacency lists and in-degrees from edges
    for (const edge of json.graph.edges) {
      const targets = adjacencyList.get(edge.source);
      if (targets) {
        targets.push({ target: edge.target, sourceHandle: edge.sourceHandle });
      }

      const sources = reverseAdjacencyList.get(edge.target);
      if (sources) {
        sources.push({ source: edge.source, targetHandle: edge.targetHandle });
      }

      const currentInDegree = inDegree.get(edge.target) ?? 0;
      inDegree.set(edge.target, currentInDegree + 1);
    }

    return {
      nodes,
      adjacencyList,
      reverseAdjacencyList,
      inDegree,
      edges: json.graph.edges,
    };
  }

  /**
   * Validate workflow JSON structure.
   * @param json - The workflow JSON to validate
   * @throws Error if validation fails
   */
  private validate(json: WorkflowJSON): void {
    if (!json.meta?.id) {
      throw new Error("Workflow must have a meta.id");
    }
    if (!json.graph) {
      throw new Error("Workflow must have a graph");
    }
    if (!Array.isArray(json.graph.nodes)) {
      throw new Error("Workflow graph must have a nodes array");
    }
    if (!Array.isArray(json.graph.edges)) {
      throw new Error("Workflow graph must have an edges array");
    }

    // Validate each node has required fields
    for (const node of json.graph.nodes) {
      if (!node.id) {
        throw new Error("Each node must have an id");
      }
      if (!node.type) {
        throw new Error(`Node ${node.id} must have a type`);
      }
    }

    // Validate edges reference existing nodes and enforce single input constraint
    const nodeIds = new Set(json.graph.nodes.map((n) => n.id));
    const targetNodesWithEdges = new Set<string>();

    for (const edge of json.graph.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(
          `Edge references non-existent source node: ${edge.source}`
        );
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(
          `Edge references non-existent target node: ${edge.target}`
        );
      }

      // Enforce single input constraint: a node can only be the target of ONE edge
      if (targetNodesWithEdges.has(edge.target)) {
        throw new Error(
          `Node ${edge.target} has multiple incoming edges. Only one input per node is allowed.`
        );
      }
      targetNodesWithEdges.add(edge.target);
    }

    const startNodes = json.graph.nodes.filter((n) => n.type === "start");
    const endNodes = json.graph.nodes.filter((n) => n.type === "end");

    if (startNodes.length > 1) {
      throw new Error(
        "Workflow can only have one Start node. Found multiple Start nodes."
      );
    }

    if (endNodes.length > 1) {
      throw new Error(
        "Workflow can only have one End node. Found multiple End nodes."
      );
    }

    if (startNodes.length === 0) {
      throw new Error("Workflow must have at least one Start node.");
    }

    if (endNodes.length === 0) {
      throw new Error("Workflow must have at least one End node.");
    }
  }

  /**
   * Get the list of capabilities required by nodes in the graph.
   * @param graph - The parsed graph
   * @returns Record of unique capability identifiers to their options
   */
  public getRequiredCapabilities(graph: ParsedGraph): Record<string, any> {
    const capabilities: Record<string, any> = {};

    for (const node of graph.nodes.values()) {
      if (AI_API_NODE_TYPES.has(node.type)) {
        if (node.type === "translatorApi") {
          // For translator, we only need source and target languages
          capabilities[node.type] = {
            sourceLanguage: node.config?.sourceLanguage,
            targetLanguage: node.config?.targetLanguage,
          };
        } else {
          // Others go without specific options for now
          capabilities[node.type] = true;
        }
      }
    }

    return capabilities;
  }

  /**
   * Get the execution plan using topological sort (Kahn's algorithm).
   * Returns nodes in an order that respects dependencies.
   * @param graph - The parsed graph
   * @returns Array of nodes in execution order
   * @throws Error if the graph contains cycles
   */
  public getExecutionPlan(graph: ParsedGraph): NodeConfig[] {
    const inDegree = new Map(graph.inDegree);
    const queue: string[] = [];
    const result: NodeConfig[] = [];

    const startNode = Array.from(graph.nodes.values()).find(
      (node) => node.type === "start"
    );

    if (startNode) queue.push(startNode.id);
    else return [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = graph.nodes.get(nodeId);

      if (node) {
        result.push(node);
      }

      const neighbors = graph.adjacencyList.get(nodeId) ?? [];
      for (const neighbor of neighbors) {
        const neighborId = neighbor.target;
        const newDegree = (inDegree.get(neighborId) ?? 1) - 1;
        inDegree.set(neighborId, newDegree);

        if (newDegree === 0) {
          queue.push(neighborId);
        }
      }
    }

    // Check for cycles
    if (result.length !== graph.nodes.size) {
      throw new Error(
        "Workflow graph contains cycles, cannot determine execution order"
      );
    }

    return result;
  }

  /**
   * Get the input nodes (nodes that provide data) for a given node.
   * @param graph - The parsed graph
   * @param nodeId - The node to find inputs for
   * @returns Array of nodes that feed into this node
   */
  public getInputNodes(graph: ParsedGraph, nodeId: string): NodeConfig[] {
    const sources = graph.reverseAdjacencyList.get(nodeId) ?? [];
    return sources
      .map((conn) => graph.nodes.get(conn.source))
      .filter((node): node is NodeConfig => node !== undefined);
  }

  /**
   * Get nodes reachable from a specific starting node and handle.
   * Returns nodes in topological order.
   * @param graph - The parsed graph
   * @param nodeId - The starting node ID
   * @param sourceHandle - The handle to start traversal from
   * @returns Array of nodes in topological order
   */
  public getReachableNodes(
    graph: ParsedGraph,
    nodeId: string,
    sourceHandle?: string | null
  ): NodeConfig[] {
    const reachable = new Set<string>();
    const stack: { id: string; handle?: string | null }[] = [
      { id: nodeId, handle: sourceHandle },
    ];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const neighbors = graph.adjacencyList.get(current.id) ?? [];

      for (const neighbor of neighbors) {
        if (current.id === nodeId && sourceHandle !== undefined) {
          if (neighbor.sourceHandle !== sourceHandle) continue;
        }

        if (!reachable.has(neighbor.target)) {
          reachable.add(neighbor.target);
          stack.push({ id: neighbor.target });
        }
      }
    }

    const fullPlan = this.getExecutionPlan(graph);
    return fullPlan.filter((node) => reachable.has(node.id));
  }
}
