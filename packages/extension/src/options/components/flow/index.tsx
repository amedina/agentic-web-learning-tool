import { useFlow } from '../../store';
import { Controls, MiniMap, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FileOutput, Import, Save, Trash } from 'lucide-react';

const Flow = () => {
	const {
		nodes,
		edges,
		nodeTypes,
		onNodesChange,
		onEdgesChange,
		onNodesDelete,
		onEdgesDelete,
		onConnect,
	} = useFlow(({ state, actions }) => ({
		nodes: state.nodes,
		edges: state.edges,
		nodeTypes: state.nodeTypes,
		onNodesChange: actions.onNodesChange,
		onEdgesChange: actions.onEdgesChange,
		onNodesDelete: actions.onNodesDelete,
		onEdgesDelete: actions.onEdgesDelete,
		onConnect: actions.onConnect,
	}));

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
					nodeTypes={nodeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onNodesDelete={onNodesDelete}
					onEdgesDelete={onEdgesDelete}
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
