/**
 * External dependencies
 */
import { createContext } from "react";
import { createContextSelector } from "react-context-selector";
import {
  type NodeConfig,
  type WorkflowMeta,
  NodeType,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */

export type ApiNodeConfig = {
  type: NodeType;
  config: NodeConfig["config"];
};

export interface ApiStoreContext {
  state: {
    nodes: {
      [id: string]: ApiNodeConfig;
    };
    selectedNode: string | null;
    capabilities: Record<string, boolean>;
    workflowMeta: WorkflowMeta;
  };
  actions: {
    getNode: (id: string) => ApiNodeConfig | undefined;
    addNode: (node: ApiNodeConfig & { id: string }) => void;
    updateNode: (
      id: string,
      updates: {
        type?: string;
        config?: ApiNodeConfig["config"];
      },
    ) => void;
    removeNode: (id: string) => void;
    setSelectedNode: (id: string | null) => void;
    updateWorkflowMeta: (updates: Partial<WorkflowMeta>) => void;
    clearApiData: () => void;
    checkCapabilities: () => Promise<void>;
  };
}

const initialState: ApiStoreContext = {
  state: {
    nodes: {},
    selectedNode: null,
    capabilities: {},
    workflowMeta: {
      id: "",
      name: "",
      description: "",
      savedAt: "",
      allowedDomains: [],
      isWebMCP: false,
    },
  },
  actions: {
    getNode: () => undefined,
    addNode: () => {},
    updateNode: () => {},
    removeNode: () => {},
    setSelectedNode: () => {},
    updateWorkflowMeta: () => {},
    clearApiData: () => {},
    checkCapabilities: async () => {},
  },
};

const context = createContext<ApiStoreContext>(initialState);

export default context;

export const [ApiCleaner, apiUseContextSelector] =
  createContextSelector(context);
