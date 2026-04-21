/**
 * External dependencies
 */
import type { Connection, EdgeChange, NodeChange } from "@xyflow/react";
import {
  NodeType,
  type EdgeConfig,
  type NodeUIConfig,
} from "@google-awlt/engine-core";
import { createContext } from "@google-awlt/common";

export type FlowNodeType = {
  id: string;
  type: NodeType;
  position: NodeUIConfig["position"];
  data: { label: string };
  status?: "running" | "success" | "error";
};

export type FlowEdgeType = EdgeConfig;

export interface FlowStoreContext {
  state: {
    nodes: FlowNodeType[];
    edges: FlowEdgeType[];
    nodeTypes: {
      [key: string]: React.ComponentType<any>;
    };
  };
  actions: {
    onNodesChange: (changes: NodeChange<FlowNodeType>[]) => void;
    onEdgesChange: (changes: EdgeChange<FlowEdgeType>[]) => void;
    onNodesDelete: (deletedNodes: FlowNodeType[]) => void;
    onEdgesDelete: (deletedEdges: FlowEdgeType[]) => void;
    onConnect: (params: Connection | FlowEdgeType) => void;
    addNode: (node: FlowNodeType) => void;
    deleteNode: (id: string) => void;
    updateNodeStatus: (
      id: string,
      status: "running" | "success" | "error" | undefined,
    ) => void;
    clearFlow: () => void;
  };
}

const initialState: FlowStoreContext = {
  state: {
    nodes: [],
    edges: [],
    nodeTypes: {},
  },
  actions: {
    onNodesChange: () => {},
    onEdgesChange: () => {},
    onNodesDelete: () => {},
    onEdgesDelete: () => {},
    onConnect: () => {},
    addNode: () => {},
    deleteNode: () => {},
    updateNodeStatus: () => {},
    clearFlow: () => {},
  },
};

const FlowContext = createContext<FlowStoreContext>(initialState);

export default FlowContext;
