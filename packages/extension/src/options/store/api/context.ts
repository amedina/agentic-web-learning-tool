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
		selectedNode: string | null;
	};
	actions: {
		getNode: (id: string) => NodeConfig | undefined;
		addNode: (node: NodeConfig & { id: string }) => void;
		updateNode: (
			id: string,
			updates: {
				type?: string;
				config?: { [key: string]: any };
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
