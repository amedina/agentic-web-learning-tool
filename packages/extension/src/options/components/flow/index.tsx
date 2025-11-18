import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	Controls,
	MiniMap,
	ReactFlow,
	type Connection,
	type EdgeChange,
	type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FileOutput, Import, Save, Trash } from 'lucide-react';
import { useCallback, useState } from 'react';

type NodeType = {
	id: string;
	position: { x: number; y: number };
	data: { label: string };
};

const initialNodes: NodeType[] = [
	{ id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
	{ id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

const Flow = () => {
	const [nodes, setNodes] = useState(initialNodes);
	const [edges, setEdges] = useState(initialEdges);

	const onNodesChange = useCallback(
		(changes: NodeChange<NodeType>[]) =>
			setNodes((nodesSnapshot) =>
				applyNodeChanges(changes, nodesSnapshot)
			),
		[]
	);
	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) =>
			setEdges((edgesSnapshot) =>
				applyEdgeChanges(changes, edgesSnapshot)
			),
		[]
	);
	const onConnect = useCallback(
		(params: Connection) =>
			setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
		[]
	);

	return (
		<div className="h-full flex-1 flex flex-col bg-gray-100 p-4 rounded">
			<div className="flex justify-between items-center mb-4 border-b border-gray-800">
				<h2 className="text-xl font-bold mb-4">Workflow Flow</h2>
				<div className="flex gap-2">
					<button className="px-4 py-2 bg-green-500 text-white rounded">
						<Import />
					</button>
					<button className="px-4 py-2 bg-green-500 text-white rounded">
						<FileOutput />
					</button>
					<button className="px-4 py-2 bg-blue-500 text-white rounded">
						<Save />
					</button>
					<button className="px-4 py-2 bg-red-500 text-white rounded">
						<Trash />
					</button>
				</div>
			</div>
			<div className="w-full flex-1">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
				>
					<MiniMap nodeStrokeWidth={3} zoomable pannable />
					<Controls position="top-right" />
				</ReactFlow>
			</div>
		</div>
	);
};

export default Flow;
