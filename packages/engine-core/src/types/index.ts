/**
 * Workflow JSON structure (serialized from UI)
 */
export interface WorkflowJSON {
  meta: WorkflowMeta;
  graph: WorkflowGraph;
}

/**
 * Workflow metadata
 */
export interface WorkflowMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  savedAt: string;
  allowedDomains: string[];
  isWebMCP: boolean;
  enabled?: boolean;
}

/**
 * Workflow graph containing nodes and edges
 */
export interface WorkflowGraph {
  nodes: NodeConfig[];
  edges: EdgeConfig[];
}

/**
 * Node configuration in the graph
 */
export interface NodeConfig {
  id: string;
  type: string;
  label?: string;
  config: Record<string, unknown>;
  ui?: NodeUIConfig;
}

/**
 * UI-specific node configuration
 */
export interface NodeUIConfig {
  position: { x: number; y: number };
}

/**
 * Edge connection between nodes
 */
export interface EdgeConfig {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

/**
 * Output produced by a node after execution
 */
export interface NodeOutput {
  status: NodeStatus;
  data?: unknown;
  error?: string;
  metadata?: {
    type: string;
    label?: string;
    config?: Record<string, unknown>;
  };
}

/**
 * Possible node execution statuses
 */
export type NodeStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "skipped";

/**
 * Execution context maintained during workflow run
 */
export interface ExecutionContext {
  workflowId: string;
  steps: Record<string, NodeOutput>;
  variables: Record<string, unknown>;
  status: ExecutionStatus;
  signal?: AbortSignal;
  loop?: {
    index: number;
    total: number;
  };
}

/**
 * Possible workflow execution statuses
 */
export type ExecutionStatus = "idle" | "running" | "completed" | "failed";
