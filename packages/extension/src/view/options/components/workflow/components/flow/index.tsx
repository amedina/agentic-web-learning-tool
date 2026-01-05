/**
 * External dependencies
 */
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { WorkflowClient } from '@google-awlt/engine-extension';
import type {
	ExecutionContext,
	NodeOutput,
	WorkflowJSON,
} from '@google-awlt/engine-core';

/**
 * Internal dependencies
 */
import {
	type EdgeType,
	type NodeType,
	useFlow,
	useApi,
	type NodeConfig,
} from '../../stateProviders';
import { Flow, Toast, SavedWorkflowsDialog } from '../ui';
import { TOOL_CONFIGS } from '../tools/toolRegistry';
import { saveWorkflow, loadWorkflow } from '../../../../utils/storage';

const ID_PREFIX = 'wf_';

const generateId = () =>
	`${ID_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const FlowContainer = () => {
	const [workflowTitle, setWorkflowTitle] = useState('Untitled Workflow');
	const [showImportDialog, setShowImportDialog] = useState(false);
	const [importJson, setImportJson] = useState('');
	const [workflowId, setWorkflowId] = useState<string | null>(null);
	const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
	const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
	const [showSavedWorkflows, setShowSavedWorkflows] = useState(false);
	const [isStopping, setIsStopping] = useState(false);
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
		updateNodeStatus,
		isRunning,
		setIsRunning,
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
		updateNodeStatus: actions.updateNodeStatus,
		isRunning: state.isRunning,
		setIsRunning: actions.setIsRunning,
	}));

	const { nodes: nodesApiData, addNode: addApiNode } = useApi(
		({ state, actions }) => ({
			nodes: state.nodes,
			addNode: actions.addNode,
		})
	);

	const { screenToFlowPosition } = useReactFlow();

	const handleDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();

			const type = event.dataTransfer.getData('workflow-composer/flow');

			if (!type || !TOOL_CONFIGS[type]) {
				return;
			}

			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			const id = new Date().getTime().toString();
			const toolConfig = TOOL_CONFIGS[type];

			addNode({
				id,
				type,
				position,
				data: { label: toolConfig.label },
			});

			addApiNode({
				id,
				type,
				config: toolConfig.config,
			});
		},
		[addNode, addApiNode, screenToFlowPosition]
	);

	const refetchTabs = useCallback(() => {
		if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
			chrome.tabs.query({}, (result) => {
				setTabs(result);

				const currentTabExists = result.some(
					(t) => t.id === selectedTabId
				);

				if (!currentTabExists || !selectedTabId) {
					const optionsTab = result.find((t) =>
						t.url?.includes('options.html')
					);

					const activeTab = result.find((t) => t.active);

					const fallbackId =
						optionsTab?.id || activeTab?.id || result[0]?.id;

					if (fallbackId) {
						setSelectedTabId(fallbackId);
					}
				}
			});
		}
	}, [selectedTabId]);

	useEffect(() => {
		refetchTabs();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps -- Fetch on first render only

	const handleImport = useCallback(() => {
		setShowImportDialog(true);
	}, []);

	const loadWorkflowData = useCallback(
		(workflowData: WorkflowJSON) => {
			clearFlow();

			if (workflowData.meta?.name) {
				setWorkflowTitle(workflowData.meta.name);
			}

			const graphNodes = workflowData.graph?.nodes;
			const graphEdges = workflowData.graph?.edges;

			if (graphNodes && Array.isArray(graphNodes)) {
				graphNodes.forEach((node) => {
					const flowNode: NodeType = {
						id: node.id,
						type: node.type,
						position: node.ui?.position || { x: 0, y: 0 },
						data: { label: node.label || 'Node' },
					};

					addNode(flowNode);

					if (node.config) {
						addApiNode({
							id: node.id,
							type: node.type,
							config: node.config,
						});
					}
				});
			}

			if (graphEdges && Array.isArray(graphEdges)) {
				graphEdges.forEach((edge: EdgeType) => {
					onConnect(edge);
				});
			}
		},
		[clearFlow, addNode, addApiNode, onConnect]
	);

	const initializeStandardNodes = useCallback(() => {
		const startId = new Date().getTime().toString() + 'start';
		const endId = new Date().getTime().toString() + 'end';

		addNode({
			id: startId,
			type: 'start',
			position: { x: 50, y: 50 },
			data: { label: 'Start' },
		});

		addApiNode({
			id: startId,
			type: 'start',
			config: {
				title: 'Start',
				description: 'Workflow entry point.',
			},
		});

		addNode({
			id: endId,
			type: 'end',
			position: { x: 750, y: 500 },
			data: { label: 'End' },
		});

		addApiNode({
			id: endId,
			type: 'end',
			config: {
				title: 'End',
				description: 'Workflow exit point.',
			},
		});
	}, [addNode, addApiNode]);

	useEffect(() => {
		(async () => {
			const params = new URLSearchParams(window.location.search);
			const idFromUrl = params.get('id');

			if (idFromUrl) {
				setWorkflowId(idFromUrl);

				try {
					const savedData = await loadWorkflow(idFromUrl);

					if (savedData) {
						loadWorkflowData(savedData);
					}
				} catch (error) {
					console.error(
						'Failed to load workflow from storage',
						error
					);
				}
			} else {
				const newId = generateId();
				setWorkflowId(newId);
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.set('id', newId);
				window.history.replaceState({}, '', newUrl.toString());
				initializeStandardNodes();
			}
		})();
	}, [loadWorkflowData, addNode, addApiNode, initializeStandardNodes]);

	const serializeWorkflow = useCallback(
		(
			id: string | null,
			title: string,
			currentNodes: NodeType[],
			currentEdges: EdgeType[],
			currentApiData: {
				[id: string]: NodeConfig;
			}
		) => {
			return {
				meta: {
					id: id || `${ID_PREFIX}${Date.now()}`,
					name: title,
					description: 'Exported from Agentic Web Learning Tool',
					version: '1.0.0',
					savedAt: new Date().toISOString(),
				},
				graph: {
					nodes: currentNodes.map((node) => ({
						id: node.id,
						type: node.type || 'default',
						label: node.data.label,
						config: currentApiData[node.id]?.config || {},
						ui: {
							position: node.position,
						},
					})),
					edges: currentEdges.map((edge) => ({
						id: edge.id,
						source: edge.source,
						target: edge.target,
						sourceHandle: edge.sourceHandle || null,
						targetHandle: edge.targetHandle || null,
					})),
				},
			};
		},
		[]
	);

	useEffect(() => {
		if (!workflowId) return;

		const timeoutId = setTimeout(() => {
			const workflowData = serializeWorkflow(
				workflowId,
				workflowTitle,
				nodes,
				edges,
				nodesApiData
			);

			saveWorkflow(workflowId, workflowData);
		}, 1000); // Debounce save by 1s

		return () => clearTimeout(timeoutId);
	}, [
		workflowId,
		workflowTitle,
		nodes,
		edges,
		nodesApiData,
		serializeWorkflow,
	]);

	const showToast = useCallback(
		(message: string, type: 'success' | 'error') => {
			setToast({ message, type });
			setTimeout(() => setToast(null), 3000);
		},
		[]
	);

	const handleExport = useCallback(async () => {
		try {
			const workflowData = serializeWorkflow(
				workflowId,
				workflowTitle,
				nodes,
				edges,
				nodesApiData
			);

			const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
				type: 'application/json',
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${workflowTitle.toLowerCase().replace(/\s+/g, '-') || 'workflow'}.json`;
			document.body.appendChild(link);
			link.click();

			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			showToast('Workflow exported as JSON file!', 'success');
		} catch (error) {
			console.error('Failed to export workflow:', error);
			showToast('Failed to export workflow', 'error');
		}
	}, [
		edges,
		nodes,
		nodesApiData,
		serializeWorkflow,
		showToast,
		workflowId,
		workflowTitle,
	]);

	const handleImportSubmit = useCallback(() => {
		try {
			clearFlow();

			const workflowData = JSON.parse(importJson);

			if (!workflowData.graph || !workflowData.meta) {
				throw new Error(
					'Invalid workflow format: Missing graph or meta'
				);
			}

			const newId = generateId();
			setWorkflowId(newId);

			const newUrl = new URL(window.location.href);
			newUrl.searchParams.set('id', newId);
			window.history.replaceState({}, '', newUrl.toString());

			loadWorkflowData(workflowData);

			const newWorkflowData = {
				...workflowData,
				meta: { ...workflowData.meta, id: newId },
			};
			saveWorkflow(newId, newWorkflowData);

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
	}, [clearFlow, importJson, loadWorkflowData, showToast]);

	const handleRun = useCallback(async () => {
		if (isRunning) return;
		if (!selectedTabId) {
			showToast('Please select a tab to run on', 'error');
			return;
		}

		setIsRunning(true);

		// Reset statuses
		nodes.forEach((node) => updateNodeStatus(node.id, undefined));

		const workflowData = serializeWorkflow(
			workflowId,
			workflowTitle,
			nodes,
			edges,
			nodesApiData
		);

		const client = new WorkflowClient();

		try {
			await client.runWorkflow(workflowData, selectedTabId, {
				onNodeStart: (nodeId: string) => {
					updateNodeStatus(nodeId, 'running');
				},
				onNodeFinish: (nodeId: string, output: NodeOutput) => {
					updateNodeStatus(
						nodeId,
						output.status === 'success' ? 'success' : 'error'
					);
				},
				onComplete: (context: ExecutionContext) => {
					setIsRunning(false);
					setIsStopping(false);
					showToast('Workflow completed successfully!', 'success');
					console.log('Workflow context:', context);
				},
				onError: (error: string) => {
					setIsRunning(false);
					setIsStopping(false);
					showToast(`Workflow failed: ${error}`, 'error');
					console.error('Workflow error:', error);
				},
			});
		} catch (error) {
			setIsRunning(false);
			setIsStopping(false);
			const msg = error instanceof Error ? error.message : String(error);
			showToast(`Failed to start workflow: ${msg}`, 'error');
		}
	}, [
		edges,
		isRunning,
		nodes,
		nodesApiData,
		selectedTabId,
		serializeWorkflow,
		setIsRunning,
		showToast,
		updateNodeStatus,
		workflowId,
		workflowTitle,
	]);

	const handleStop = useCallback(async () => {
		const client = new WorkflowClient();

		try {
			setIsStopping(true);
			await client.stopWorkflow();
			showToast('Stopping workflow...', 'success');
		} catch (error) {
			setIsStopping(false);
			const msg = error instanceof Error ? error.message : String(error);
			showToast(`Failed to stop workflow: ${msg}`, 'error');
		}
	}, [showToast]);

	const handleClear = useCallback(() => {
		if (
			window.confirm(
				'Are you sure you want to clear the workflow? This action cannot be undone.'
			)
		) {
			clearFlow();
		}
	}, [clearFlow]);

	const handleNewWorkflow = useCallback(() => {
		if (
			window.confirm(
				'Create a new workflow? This will start a fresh canvas. Your current workflow is auto-saved.'
			)
		) {
			const newId = generateId();

			setWorkflowId(newId);
			setWorkflowTitle('Untitled Workflow');
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.set('id', newId);
			window.history.replaceState({}, '', newUrl.toString());

			clearFlow();
			initializeStandardNodes();

			const initialData = {
				meta: {
					id: newId,
					name: 'Untitled Workflow',
					description: '',
					version: '1.0.0',
					savedAt: new Date().toISOString(),
				},
				graph: {
					nodes: [
						{
							id: 'start_node',
							type: 'start',
							label: 'Start',
							config: {
								title: 'Start',
								description: 'Workflow entry point.',
							},
							ui: { position: { x: 100, y: 100 } },
						},
					],
					edges: [],
				},
			};
			saveWorkflow(newId, initialData);
			showToast('New workflow created!', 'success');
		}
	}, [clearFlow, initializeStandardNodes, showToast]);

	const handleLoadSaved = useCallback(() => {
		setShowSavedWorkflows(true);
	}, []);

	const handleWorkflowLoad = useCallback(
		async (id: string) => {
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.set('id', id);
			window.history.pushState({}, '', newUrl.toString());

			setWorkflowId(id);

			const data = await loadWorkflow(id);
			if (data) {
				loadWorkflowData(data);
				showToast('Workflow loaded successfully', 'success');
			} else {
				showToast('Failed to load workflow', 'error');
			}
		},
		[loadWorkflowData, showToast]
	);

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

			<SavedWorkflowsDialog
				isOpen={showSavedWorkflows}
				onClose={() => setShowSavedWorkflows(false)}
				onLoad={handleWorkflowLoad}
			/>

			{/* Toast Notification */}
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type === 'success' ? 'success' : 'error'}
					onClose={() => setToast(null)}
				/>
			)}

			<div className="flex-1 w-full h-full">
				<Flow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onNodesDelete={onNodesDelete}
					onEdgesDelete={onEdgesDelete}
					onConnect={onConnect}
					title={workflowTitle}
					onTitleChange={setWorkflowTitle}
					selectedTabId={selectedTabId}
					setSelectedTabId={setSelectedTabId}
					tabs={tabs}
					isRunning={isRunning}
					isStopping={isStopping}
					actions={{
						onImport: handleImport,
						onExport: handleExport,
						onClear: handleClear,
						onNew: handleNewWorkflow,
						onRun: handleRun,
						onStop: handleStop,
						onDrop: handleDrop,
						onLoadSaved: handleLoadSaved,
						onRefreshTabs: refetchTabs,
					}}
				/>
			</div>
		</div>
	);
};

export default FlowContainer;
