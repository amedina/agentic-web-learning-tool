import type { Connection, EdgeChange, NodeChange } from '@xyflow/react';
import { createContext } from 'react';
import { createContextSelector } from 'react-context-selector';

export type NodeType = {
	id: string;
	type?: string;
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
		nodeTypes: {
			[key: string]: () => React.JSX.Element;
		};
	};
	actions: {
		onNodesChange: (changes: NodeChange<NodeType>[]) => void;
		onEdgesChange: (changes: EdgeChange<EdgeType>[]) => void;
		onNodesDelete: (deletedNodes: NodeType[]) => void;
		onEdgesDelete: (deletedEdges: EdgeType[]) => void;
		onConnect: (params: Connection | EdgeType) => void;
		addNode: (node: NodeType) => void;
		deleteNode: (id: string) => void;
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
		clearFlow: () => {},
	},
};

const context = createContext<FlowStoreContext>(initialState);

export default context;

export const [FlowCleaner, flowUseContextSelector] =
	createContextSelector(context);
