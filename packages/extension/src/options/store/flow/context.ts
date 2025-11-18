import type { Connection, EdgeChange, NodeChange } from '@xyflow/react';
import { createContext } from 'react';
import { createContextSelector } from 'react-context-selector';

export type NodeType = {
	id: string;
	position: { x: number; y: number };
	data: { label: string };
};

export type EdgeType = {
	id: string;
	source: string;
	target: string;
};

export interface FlowStoreContext {
	state: {
		nodes: NodeType[];
		edges: EdgeType[];
	};
	actions: {
		onNodesChange: (changes: NodeChange<NodeType>[]) => void;
		onEdgesChange: (changes: EdgeChange<EdgeType>[]) => void;
		onConnect: (params: Connection | EdgeType) => void;
	};
}

const initialState: FlowStoreContext = {
	state: {
		nodes: [],
		edges: [],
	},
	actions: {
		onNodesChange: () => {},
		onEdgesChange: () => {},
		onConnect: () => {},
	},
};

const context = createContext<FlowStoreContext>(initialState);

export default context;

export const [Cleaner, useContextSelector] = createContextSelector(context);
