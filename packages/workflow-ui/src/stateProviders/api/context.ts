/**
 * External dependencies
 */
import { type NodeConfig, NodeType } from "@google-awlt/engine-core";
import { type WorkflowMeta } from "@google-awlt/engine-core";
import { createContext } from "@google-awlt/common";

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
    updateWorkflowMeta: (
      updates: Partial<WorkflowMeta>,
      newMeta?: boolean,
    ) => void;
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
      sanitizedName: "",
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

const ApiContext = createContext<ApiStoreContext>(initialState);

export default ApiContext;
