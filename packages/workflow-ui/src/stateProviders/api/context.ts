/**
 * External dependencies
 */
import { createContext } from "react";
import { createContextSelector } from "react-context-selector";
import { type WorkflowMeta } from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import {
  type AlertNotificationConfig,
  type ConditionConfig,
  type DomInputConfig,
  type LanguageDetectorApiConfig,
  type PromptApiConfig,
  type ProofreaderApiConfig,
  type RewriterApiConfig,
  type StaticInputConfig,
  type SummarizerApiConfig,
  type TranslatorApiConfig,
  type WriterApiConfig,
  type LoopConfig,
  type DomReplacementConfig,
  type FileCreatorConfig,
  type TooltipConfig,
  type DataTransformerConfig,
  type MathConfig,
} from "./../../components";

export type NodeConfig = {
  type: string;
  config: Partial<
    | LanguageDetectorApiConfig
    | PromptApiConfig
    | ProofreaderApiConfig
    | RewriterApiConfig
    | SummarizerApiConfig
    | TranslatorApiConfig
    | WriterApiConfig
    | DomInputConfig
    | StaticInputConfig
    | ConditionConfig
    | AlertNotificationConfig
    | LoopConfig
    | DomReplacementConfig
    | FileCreatorConfig
    | TooltipConfig
    | DataTransformerConfig
    | MathConfig
  >;
};

export interface ApiStoreContext {
  state: {
    nodes: {
      [id: string]: NodeConfig;
    };
    selectedNode: string | null;
    capabilities: Record<string, boolean>;
    workflowMeta: WorkflowMeta;
  };
  actions: {
    getNode: (id: string) => NodeConfig | undefined;
    addNode: (node: NodeConfig & { id: string }) => void;
    updateNode: (
      id: string,
      updates: {
        type?: string;
        config?: NodeConfig["config"];
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
      version: "1.0.0",
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
