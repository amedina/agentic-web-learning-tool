/**
 * External dependencies
 */
import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { WorkflowClient } from '@google-awlt/engine-extension';

/**
 * Internal dependencies
 */
import { type EdgeType, type NodeType, useFlow, useApi } from '../../store';
import { Flow } from '../ui';

const ID_PREFIX = 'wf_';
const STORAGE_PREFIX = 'workflow-';

const generateId = () =>
  `${ID_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const WorkflowCanvas = () => {
  const [workflowTitle, setWorkflowTitle] = useState('Untitled Workflow');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [selectedTabId, setSelectedTabId] = useState<number | null>(null);
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

  // Fetch tabs on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({}, (result) => {
        setTabs(result);
        // Select active tab if found
        const activeTab = result.find((t) => t.active);
        if (activeTab?.id) {
          setSelectedTabId(activeTab.id);
        }
      });
    }
  }, []);

  const handleImport = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  const loadWorkflowData = useCallback(
    (workflowData: any) => {
      clearFlow();

      if (workflowData.meta?.name) {
        setWorkflowTitle(workflowData.meta.name);
      }

      const graphNodes = workflowData.graph?.nodes;
      const graphEdges = workflowData.graph?.edges;

      if (graphNodes && Array.isArray(graphNodes)) {
        graphNodes.forEach((node: any) => {
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

  const addPlaceholderNode = useCallback(() => {
    const id = new Date().getTime().toString();

    addNode({
      id,
      type: 'staticInput',
      position: { x: 10, y: 10 },
      data: { label: 'Static Input' },
    });

    addApiNode({
      id,
      type: 'staticInput',
      config: {
        title: 'Static Input',
        description: 'Provide a static text input.',
        inputValue: '',
      },
    });
  }, [addNode, addApiNode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id');

    if (idFromUrl) {
      setWorkflowId(idFromUrl);

      const savedData = localStorage.getItem(`${STORAGE_PREFIX}${idFromUrl}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          loadWorkflowData(parsed);
          return;
        } catch (e) {
          console.error('Failed to load workflow from storage', e);
        }
      }
    }

    const newId = generateId();
    setWorkflowId(newId);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('id', newId);
    window.history.replaceState({}, '', newUrl.toString());
    addPlaceholderNode();
  }, [loadWorkflowData, addNode, addApiNode, addPlaceholderNode]);

  const serializeWorkflow = useCallback(
    (
      id: string | null,
      title: string,
      currentNodes: NodeType[],
      currentEdges: EdgeType[],
      currentApiData: any
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

    const workflowData = serializeWorkflow(
      workflowId,
      workflowTitle,
      nodes,
      edges,
      nodesApiData
    );

    localStorage.setItem(
      `${STORAGE_PREFIX}${workflowId}`,
      JSON.stringify(workflowData)
    );
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

      await navigator.clipboard.writeText(
        JSON.stringify(workflowData, null, 2)
      );
      showToast('Workflow exported to clipboard!', 'success');
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
        throw new Error('Invalid workflow format: Missing graph or meta');
      }

      const newId = generateId();
      setWorkflowId(newId);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('id', newId);
      window.history.replaceState({}, '', newUrl.toString());

      loadWorkflowData(workflowData);

      localStorage.setItem(
        `${STORAGE_PREFIX}${newId}`,
        JSON.stringify({
          ...workflowData,
          meta: { ...workflowData.meta, id: newId },
        })
      );

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
      await client.runWorkflow(workflowData as any, selectedTabId, {
        onNodeStart: (nodeId: string) => {
          updateNodeStatus(nodeId, 'running');
        },
        onNodeFinish: (nodeId: string, output: any) => {
          updateNodeStatus(
            nodeId,
            output.status === 'success' ? 'success' : 'error'
          );
        },
        onComplete: (context: any) => {
          setIsRunning(false);
          showToast('Workflow completed successfully!', 'success');
          console.log('Workflow context:', context);
        },
        onError: (error: string) => {
          setIsRunning(false);
          showToast(`Workflow failed: ${error}`, 'error');
          console.error('Workflow error:', error);
        },
      });
    } catch (error) {
      setIsRunning(false);
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

      const initialData = {
        meta: {
          id: newId,
          name: 'Untitled Workflow',
          description: '',
          version: '1.0.0',
          savedAt: new Date().toISOString(),
        },
        graph: { nodes: [], edges: [] },
      };
      localStorage.setItem(
        `${STORAGE_PREFIX}${newId}`,
        JSON.stringify(initialData)
      );
      showToast('New workflow creating!', 'success');
    }
  }, [clearFlow, showToast]);

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
          actions={{
            onImport: handleImport,
            onExport: handleExport,
            onClear: handleClear,
            onNew: handleNewWorkflow,
            onRun: handleRun,
          }}
        />
      </div>
    </div>
  );
};

export default WorkflowCanvas;
