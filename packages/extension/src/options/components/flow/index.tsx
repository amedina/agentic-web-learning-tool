import { useFlow } from '../../store';
import { Controls, MiniMap, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Play, Save, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

const Flow = () => {
	const [workflowTitle, setWorkflowTitle] = useState('Untitled Workflow');

	const {
		nodes,
		edges,
		nodeTypes,
		onNodesChange,
		onEdgesChange,
		onNodesDelete,
		onEdgesDelete,
		onConnect,
		deleteNode,
	} = useFlow(({ state, actions }) => ({
		nodes: state.nodes,
		edges: state.edges,
		nodeTypes: state.nodeTypes,
		onNodesChange: actions.onNodesChange,
		onEdgesChange: actions.onEdgesChange,
		onNodesDelete: actions.onNodesDelete,
		onEdgesDelete: actions.onEdgesDelete,
		onConnect: actions.onConnect,
		deleteNode: actions.deleteNode,
	}));

	const handleImport = () => {
		return; // Placeholder to ignore
	};

	const handleExport = () => {
		return; // Placeholder to ignore
	};

	const clearWorkflow = () => {
		if (
			window.confirm(
				'Are you sure you want to clear the entire workflow? This action cannot be undone.'
			)
		) {
			nodes.forEach((node) => {
				deleteNode(node.id);
			});

			edges.forEach((edge) => {
				deleteNode(edge.id);
			});
		}
	};

	const handleSave = () => {
		try {
			const workflowData = {
				title: workflowTitle,
				nodes,
				edges,
				savedAt: new Date().toISOString(),
			};

			localStorage.setItem(
				`workflow-${Date.now()}`,
				JSON.stringify(workflowData)
			);

			alert(`Workflow "${workflowTitle}" saved successfully!`);
		} catch (error) {
			console.error('Failed to save workflow:', error);
			alert('Failed to save workflow');
		}
	};

	const handleRun = () => {
		return; // Placeholder to ignore
	};

	return (
		<div className="h-full flex-1 flex flex-col rounded bg-gray-100">
			<div className="h-15 bg-gray-200 flex items-center justify-between px-2 m-4 mb-0 border-b border-slate-300 rounded">
				<div className="flex items-center gap-2">
					<input
						className="bg-slate-100 px-3 py-1 rounded text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
						value={workflowTitle}
						onChange={(e) => setWorkflowTitle(e.target.value)}
						placeholder="Enter workflow title..."
					></input>
					<button
						onClick={handleSave}
						className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
					>
						<Save size={16} />
						Save
					</button>{' '}
					<div className="h-6 w-px bg-slate-200 mx-2"></div>
					<select className="text-sm border border-slate-200 rounded px-2 py-1.5 bg-slate-50 text-slate-600 focus:outline-none focus:border-indigo-500">
						<option value="global">Global</option>
						<option value="amazon">www.amazon.com</option>
						<option value="weather">www.weather.com</option>
						<option value="bbc">www.bbc.com</option>
					</select>
				</div>

				<div className="flex items-center gap-2">
					<button
						className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded cursor-pointer transition-colors"
						onClick={handleImport}
					>
						<Upload size={16} />
						Export
					</button>

					<button
						onClick={handleExport}
						className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
					>
						<Download size={16} />
						Import
					</button>

					<button
						onClick={clearWorkflow}
						className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
					>
						<Trash2 size={16} />
						Clear
					</button>

					<div className="w-px h-6 bg-slate-200 mx-2"></div>

					<button
						onClick={handleRun}
						className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors"
					>
						<Play size={16} />
						Run
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
