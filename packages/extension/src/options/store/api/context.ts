import { createContext } from 'react';
import { createContextSelector } from 'react-context-selector';

export type NodeConfig = {
	type: string;
	config: { [key: string]: any };
};

export interface ApiStoreContext {
	state: {
		nodes: {
			[id: string]: NodeConfig;
		};
	};
	actions: {
		getNode: (id: string) => NodeConfig | undefined;
		addNode: (node: NodeConfig & { id: string }) => void;
		updateNode: (id: string, updates: NodeConfig) => void;
		removeNode: (id: string) => void;
	};
}

const initialState: ApiStoreContext = {
	state: {
		nodes: {},
	},
	actions: {
		getNode: () => undefined,
		addNode: () => {},
		updateNode: () => {},
		removeNode: () => {},
	},
};

const context = createContext<ApiStoreContext>(initialState);

export default context;

export const [ApiCleaner, apiUseContextSelector] =
	createContextSelector(context);
