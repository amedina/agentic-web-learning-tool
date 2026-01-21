/**
 * External dependencies
 */
import { createContext } from 'react';
import { createContextSelector } from 'react-context-selector';

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
} from './../../components';

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
  >;
};

export interface ApiStoreContext {
  state: {
    nodes: {
      [id: string]: NodeConfig;
    };
    selectedNode: string | null;
    capabilities: Record<string, boolean>;
  };
  actions: {
    getNode: (id: string) => NodeConfig | undefined;
    addNode: (node: NodeConfig & { id: string }) => void;
    updateNode: (
      id: string,
      updates: {
        type?: string;
        config?: NodeConfig['config'];
      }
    ) => void;
    removeNode: (id: string) => void;
    setSelectedNode: (id: string | null) => void;
    clearApiData: () => void;
    checkCapabilities: () => Promise<void>;
  };
}

const initialState: ApiStoreContext = {
  state: {
    nodes: {},
    selectedNode: null,
    capabilities: {},
  },
  actions: {
    getNode: () => undefined,
    addNode: () => {},
    updateNode: () => {},
    removeNode: () => {},
    setSelectedNode: () => {},
    clearApiData: () => {},
    checkCapabilities: async () => {},
  },
};

const context = createContext<ApiStoreContext>(initialState);

export default context;

export const [ApiCleaner, apiUseContextSelector] =
  createContextSelector(context);
