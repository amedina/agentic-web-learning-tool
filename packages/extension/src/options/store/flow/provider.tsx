import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type Connection,
	type EdgeChange,
	type NodeChange,
} from '@xyflow/react';
import Context, { FlowCleaner, type EdgeType, type NodeType } from './context';
import { PromptAPINode } from '../../components/tools/builtinAITools/toolNodes';

const initialNodes: NodeType[] = [
	{ id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
	{ id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges: EdgeType[] = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

const FlowProvider = ({ children }: PropsWithChildren) => {
	const [nodes, setNodes] = useState(initialNodes);
	const [edges, setEdges] = useState(initialEdges);
	const nodeTypes = useMemo(
		() => ({
			promptApi: PromptAPINode,
		}),
		[]
	);

	const onNodesChange = useCallback(
		(changes: NodeChange<NodeType>[]) =>
			setNodes((nodesSnapshot) =>
				applyNodeChanges(changes, nodesSnapshot)
			),
		[]
	);
	const onEdgesChange = useCallback(
		(changes: EdgeChange<EdgeType>[]) =>
			setEdges((edgesSnapshot) =>
				applyEdgeChanges(changes, edgesSnapshot)
			),
		[]
	);
	const onConnect = useCallback(
		(params: Connection | EdgeType) =>
			setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
		[]
	);

	const addNode = useCallback((node: NodeType) => {
		setNodes((prev) => [...prev, node]);
	}, []);

	return (
		<Context.Provider
			value={{
				state: {
					nodes,
					edges,
					nodeTypes,
				},
				actions: {
					onNodesChange,
					onEdgesChange,
					onConnect,
					addNode,
				},
			}}
		>
			<FlowCleaner />
			{children}
		</Context.Provider>
	);
};

export default FlowProvider;
