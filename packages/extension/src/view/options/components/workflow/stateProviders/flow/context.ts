/**
 * External dependencies
 */
import type { Connection, EdgeChange, NodeChange } from '@xyflow/react';
import { createContext } from 'react';
import { createContextSelector } from 'react-context-selector';

export type NodeType = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  status?: 'running' | 'success' | 'error';
};

export type EdgeType = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export interface FlowStoreContext {
  state: {
    nodes: NodeType[];
    edges: EdgeType[];
    nodeTypes: {
      [key: string]: React.ComponentType<any>;
    };
    isRunning: boolean;
  };
  actions: {
    onNodesChange: (changes: NodeChange<NodeType>[]) => void;
    onEdgesChange: (changes: EdgeChange<EdgeType>[]) => void;
    onNodesDelete: (deletedNodes: NodeType[]) => void;
    onEdgesDelete: (deletedEdges: EdgeType[]) => void;
    onConnect: (params: Connection | EdgeType) => void;
    addNode: (node: NodeType) => void;
    deleteNode: (id: string) => void;
    updateNodeStatus: (
      id: string,
      status: 'running' | 'success' | 'error' | undefined
    ) => void;
    setIsRunning: (isRunning: boolean) => void;
    clearFlow: () => void;
  };
}

const initialState: FlowStoreContext = {
  state: {
    nodes: [],
    edges: [],
    nodeTypes: {},
    isRunning: false,
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
    setIsRunning: () => {},
    clearFlow: () => {},
  },
};

const context = createContext<FlowStoreContext>(initialState);

export default context;

export const [FlowCleaner, flowUseContextSelector] =
  createContextSelector(context);
