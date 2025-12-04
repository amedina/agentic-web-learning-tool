import { useApi, useFlow } from '../../store';
import { Controls, MiniMap, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Play, Save, Trash2, Upload, X } from 'lucide-react';
import { useState } from 'react';
import type { EdgeType, NodeType } from '../../store/flow/context';

const Flow = () => {
	const [workflowTitle, setWorkflowTitle] = useState('Untitled Workflow');
	const [showImportDialog, setShowImportDialog] = useState(false);
	const [importJson, setImportJson] = useState('');
	const [toast, setToast] = useState<{
		message: string;
		type: 'success' | 'error';
	} | null>(null);

	const {
		nodes,
		edges,
		nodeTypes,
		onNodesChange,
		onEdgesChange,
		onNodesDelete,
		onEdgesDelete,
		onConnect,
		clearFlow,
		addNode,
	} = useFlow(({ state, actions }) => ({
		nodes: state.nodes,
		edges: state.edges,
		nodeTypes: state.nodeTypes,
		onNodesChange: actions.onNodesChange,
		onEdgesChange: actions.onEdgesChange,
		onNodesDelete: actions.onNodesDelete,
		onEdgesDelete: actions.onEdgesDelete,
		onConnect: actions.onConnect,
		clearFlow: actions.clearFlow,
		addNode: actions.addNode,
	}));

	const { nodes: nodesApiData, addNode: addApiNode } = useApi(
		({ state, actions }) => ({
			nodes: state.nodes,
			addNode: actions.addNode,
		})
	);

	const handleImport = () => {
		setShowImportDialog(true);
	};

	const handleExport = async () => {
		try {
			const workflowData = {
				title: workflowTitle,
				nodes,
				nodesApiData,
				edges,
				savedAt: new Date().toISOString(),
			};

			await navigator.clipboard.writeText(
				JSON.stringify(workflowData, null, 2)
			);
			showToast('Workflow exported to clipboard!', 'success');
		} catch (error) {
			console.error('Failed to export workflow:', error);
			showToast('Failed to export workflow', 'error');
		}
	};

	const handleImportSubmit = () => {
		try {
			clearFlow();

			const workflowData = JSON.parse(importJson);

			if (workflowData.title) {
				setWorkflowTitle(workflowData.title);
			}

			if (workflowData.nodes && Array.isArray(workflowData.nodes)) {
				workflowData.nodes.forEach((node: NodeType) => {
					addNode(node);
				});
			}

			if (workflowData.edges && Array.isArray(workflowData.edges)) {
				workflowData.edges.forEach((edge: EdgeType) => {
					onConnect(edge);
				});
			}

			if (
				workflowData.nodesApiData &&
				typeof workflowData.nodesApiData == 'object'
			) {
				Object.entries(workflowData.nodesApiData).forEach(
					([id, config]: [string, any]) => {
						addApiNode({
							id,
							...config,
						});
					}
				);
			}

			setShowImportDialog(false);
			setImportJson('');
			showToast('Workflow imported successfully!', 'success');
		} catch (error) {
			console.error('Failed to import workflow:', error);
			showToast(
				'Failed to import workflow. Please check the JSON format.',
				'error'
			);
		}
	};

	const showToast = (message: string, type: 'success' | 'error') => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 3000);
	};

	const handleSave = () => {
		try {
			const workflowData = {
				title: workflowTitle,
				nodes,
				nodesApiData,
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

	const handleClear = () => {
		if (
			window.confirm(
				'Are you sure you want to clear the workflow? This action cannot be undone.'
			)
		) {
			clearFlow();
		}
	};

	return (
		<div className="h-full flex-1 flex flex-col rounded bg-gray-100 relative">
			{/* Import Dialog */}
			{showImportDialog && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-900">
								Import Workflow
							</h3>
							<button
								onClick={() => setShowImportDialog(false)}
								className="text-gray-400 hover:text-gray-600"
							>
								<X size={24} />
							</button>
						</div>
						<div className="mb-4">
							<label
								htmlFor="import-json"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Paste workflow JSON:
							</label>
							<textarea
								id="import-json"
								value={importJson}
								onChange={(e) => setImportJson(e.target.value)}
								className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder='{"title": "My Workflow", "nodes": [...], "edges": [...], "savedAt": "..."}'
							/>
						</div>
						<div className="flex justify-end gap-3">
							<button
								onClick={() => setShowImportDialog(false)}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleImportSubmit}
								className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
							>
								Import
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Toast Notification */}
			{toast && (
				<div
					className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
						toast.type === 'success'
							? 'bg-green-500 text-white'
							: 'bg-red-500 text-white'
					}`}
				>
					{toast.message}
				</div>
			)}

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
						Import
					</button>

					<button
						onClick={handleExport}
						className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
					>
						<Download size={16} />
						Export
					</button>

					<button
						onClick={handleClear}
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
