import { createContext } from 'react';
import { createContextSelector } from 'react-context-selector';
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
} from './../../components/tools';

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
	>;
};

export interface ApiStoreContext {
	state: {
		nodes: {
			[id: string]: NodeConfig;
		};
		selectedNode: string | null;
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
	};
}

const initialState: ApiStoreContext = {
	state: {
		nodes: {},
		selectedNode: null,
	},
	actions: {
		getNode: () => undefined,
		addNode: () => {},
		updateNode: () => {},
		removeNode: () => {},
		setSelectedNode: () => {},
	},
};

const context = createContext<ApiStoreContext>(initialState);

export default context;

export const [ApiCleaner, apiUseContextSelector] =
	createContextSelector(context);
