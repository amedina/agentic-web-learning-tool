/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  getLastOpenedWorkflowId,
  WorkflowClient,
} from "@google-awlt/engine-extension";
import {
  type ExecutionContext,
  type NodeConfig,
  type NodeOutput,
  NodeType,
  type WorkflowJSON,
  WorkflowJSONSchema,
} from "@google-awlt/engine-core";
import { saveWorkflow, loadWorkflow } from "@google-awlt/engine-extension";

/**
 * Internal dependencies
 */
import {
  type FlowEdgeType,
  type FlowNodeType,
  useFlow,
  useApi,
  type ApiNodeConfig,
} from "../../stateProviders";
import { Flow, Toast, SavedWorkflowsDialog, ImportDialog } from "../ui";
import { PREDEFINED_WORKFLOWS } from "../ui/flow/demoWorkflows";
import { TOOL_CONFIGS } from "../tools/toolRegistry";

const ID_PREFIX = "wf_";
const STORAGE_KEY_SELECTED_TAB = "awl_wc_selected_tab_id";

const generateId = () => {
  const id = crypto.randomUUID();
  return `${ID_PREFIX}${id}`;
};

interface WorkflowCanvasProps {
  theme: "light" | "dark" | "system";
  workflowId: string | null;
  setWorkflowId: (id: string | null) => void;
}

const WorkflowCanvas = ({
  theme,
  workflowId,
  setWorkflowId,
}: WorkflowCanvasProps) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, _setImportJson] = useState("");
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [selectedTabId, _setSelectedTabId] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SELECTED_TAB);
    return saved ? Number(saved) : null;
  });

  const setImportJson = useCallback((json: string) => {
    _setImportJson(json);
  }, []);

  const setSelectedTabId = useCallback((id: number | null) => {
    _setSelectedTabId(id);
    if (id !== null) {
      localStorage.setItem(STORAGE_KEY_SELECTED_TAB, String(id));
    } else {
      localStorage.removeItem(STORAGE_KEY_SELECTED_TAB);
    }
  }, []);
  const [showSavedWorkflows, setShowSavedWorkflows] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
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

  const {
    nodes: nodesApiData,
    addNode: addApiNode,
    workflowMeta,
    updateWorkflowMeta,
    setSelectedNode,
  } = useApi(({ state, actions }) => ({
    nodes: state.nodes,
    addNode: actions.addNode,
    workflowMeta: state.workflowMeta,
    updateWorkflowMeta: actions.updateWorkflowMeta,
    setSelectedNode: actions.setSelectedNode,
  }));

  const { screenToFlowPosition } = useReactFlow();

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "workflow-composer/flow",
      ) as NodeType;

      if (
        !type ||
        !Object.values(NodeType).includes(type) ||
        !TOOL_CONFIGS[type]
      ) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = crypto.randomUUID();
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
    [addNode, addApiNode, screenToFlowPosition],
  );

  const refetchTabs = useCallback(() => {
    if (typeof chrome !== "undefined" && chrome.tabs?.query) {
      chrome.tabs.query({}, (result) => {
        setTabs(result);

        const currentTabExists = result.some((t) => t.id === selectedTabId);

        if (!currentTabExists || !selectedTabId) {
          const optionsTab = result.find((t) =>
            t.url?.includes("options.html"),
          );

          const activeTab = result.find((t) => t.active);

          const fallbackId = optionsTab?.id || activeTab?.id || result[0]?.id;

          if (fallbackId) {
            setSelectedTabId(fallbackId);
          }
        }
      });
    }
  }, [selectedTabId, setSelectedTabId]);

  useEffect(() => {
    refetchTabs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- Fetch on first render only

  const handleImport = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  const loadWorkflowData = useCallback(
    (workflowData: WorkflowJSON) => {
      clearFlow();

      if (workflowData.meta) {
        updateWorkflowMeta(workflowData.meta);
      }

      const graphNodes = workflowData.graph?.nodes;
      const graphEdges = workflowData.graph?.edges;

      if (graphNodes && Array.isArray(graphNodes)) {
        graphNodes.forEach((node) => {
          const flowNode: FlowNodeType = {
            id: node.id,
            type: node.type,
            position: node.ui?.position || { x: 0, y: 0 },
            data: { label: node.type },
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
        graphEdges.forEach((edge: FlowEdgeType) => {
          onConnect(edge);
        });
      }
    },
    [clearFlow, addNode, addApiNode, onConnect, updateWorkflowMeta],
  );

  const initializeStandardNodes = useCallback(() => {
    clearFlow();
    const startId = crypto.randomUUID() + "start";
    const endId = crypto.randomUUID() + "end";

    addNode({
      id: startId,
      type: NodeType.START,
      position: { x: 50, y: 50 },
      data: { label: "Start" },
    });

    addApiNode({
      id: startId,
      type: NodeType.START,
      config: {
        title: "Start",
        description: "Workflow entry point.",
      },
    });

    addNode({
      id: endId,
      type: NodeType.END,
      position: { x: 750, y: 500 },
      data: { label: "End" },
    });

    addApiNode({
      id: endId,
      type: NodeType.END,
      config: {
        title: "End",
        description: "Workflow exit point.",
      },
    });

    setSelectedNode(null);
  }, [addNode, addApiNode]);

  useEffect(() => {
    (async () => {
      if (workflowId) {
        try {
          const savedData = await loadWorkflow(workflowId);

          if (savedData) {
            loadWorkflowData(savedData);
          }
        } catch (error) {
          console.error("Failed to load workflow from storage", error);
        }
      } else {
        const newId = generateId();
        setWorkflowId(newId);
        initializeStandardNodes();
      }
    })();
  }, [
    loadWorkflowData,
    addNode,
    addApiNode,
    initializeStandardNodes,
    setWorkflowId,
    workflowId,
  ]);

  const serializeWorkflow = useCallback(
    (
      id: string | null,
      currentNodes: FlowNodeType[],
      currentEdges: FlowEdgeType[],
      currentApiData: {
        [id: string]: ApiNodeConfig;
      },
    ): WorkflowJSON => {
      return {
        meta: {
          ...workflowMeta,
          id: id || generateId(),
          name: workflowMeta.name || "Untitled Workflow",
          savedAt: new Date().toISOString(),
        },
        graph: {
          // @ts-ignore - node.type is defined as NodeType, and type as z.liternal, which is causing mismatch.
          nodes: currentNodes.map<NodeConfig>((node) => ({
            id: node.id,
            type: node.type,
            config: currentApiData[node.id].config,
            label: node.data.label,
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
    [workflowMeta],
  );

  useEffect(() => {
    if (
      !workflowId ||
      !workflowMeta.autosave ||
      workflowMeta.id.startsWith("demo-")
    )
      return;

    const timeoutId = setTimeout(() => {
      const workflowData = serializeWorkflow(
        workflowId,
        nodes,
        edges,
        nodesApiData,
      );

      saveWorkflow(workflowId, workflowData);
    }, 1000); // Debounce save by 1s

    return () => clearTimeout(timeoutId);
  }, [
    workflowId,
    nodes,
    edges,
    nodesApiData,
    serializeWorkflow,
    workflowMeta.autosave,
  ]);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!workflowId || workflowMeta.id.startsWith("demo-")) return;

    try {
      const workflowData = serializeWorkflow(
        workflowId,
        nodes,
        edges,
        nodesApiData,
      );

      // Validate workflow data before saving
      const validation = WorkflowJSONSchema.safeParse(workflowData);
      if (!validation.success) {
        const firstError = validation.error.issues[0];

        const node = workflowData.graph.nodes.find(
          (_, index) => index === firstError?.path[2],
        );

        showToast(
          `Validation Error: ${firstError?.message} at ${node?.label} on ${firstError?.path.slice(3).join(".")}`,
          "error",
        );
        console.error("Workflow validation failed:", validation.error);

        return;
      }

      await saveWorkflow(workflowId, workflowData);
      showToast("Workflow saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save workflow:", error);
      showToast("Failed to save workflow", "error");
    }
  }, [workflowId, serializeWorkflow, nodes, edges, nodesApiData, showToast]);

  const handleExport = useCallback(async () => {
    try {
      const workflowData = serializeWorkflow(
        workflowId,
        nodes,
        edges,
        nodesApiData,
      );

      const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        workflowMeta.name.toLowerCase().replace(/\s+/g, "-") || "workflow"
      }.json`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Workflow exported as JSON file!", "success");
    } catch (error) {
      console.error("Failed to export workflow:", error);
      showToast("Failed to export workflow", "error");
    }
  }, [
    edges,
    nodes,
    nodesApiData,
    serializeWorkflow,
    showToast,
    workflowId,
    workflowMeta.name,
  ]);

  const handleImportSubmit = useCallback(() => {
    try {
      const workflowData = JSON.parse(importJson);

      // Validate workflow data before importing
      const validation = WorkflowJSONSchema.safeParse(workflowData);
      if (!validation.success) {
        const errorMsg =
          "Failed to import workflow. Please check the JSON format.";

        showToast(errorMsg, "error");
        console.error("Workflow import validation failed:", validation.error);

        return;
      }

      clearFlow();

      const newId = generateId();
      setWorkflowId(newId);
      loadWorkflowData(workflowData);

      const newWorkflowData = {
        ...workflowData,
        meta: { ...workflowData.meta, id: newId },
      };
      saveWorkflow(newId, newWorkflowData);

      setShowImportDialog(false);
      setImportJson("");
      showToast("Workflow imported successfully!", "success");
    } catch (error) {
      console.error("Failed to import workflow:", error);
      showToast("Invalid workflow JSON.", "error");
    }
  }, [clearFlow, importJson, loadWorkflowData, setWorkflowId, showToast]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    if (!selectedTabId) {
      showToast("Please select a tab to run on", "error");
      return;
    }

    setIsRunning(true);

    // Reset statuses
    nodes.forEach((node) => updateNodeStatus(node.id, undefined));

    const workflowData = serializeWorkflow(
      workflowId,
      nodes,
      edges,
      nodesApiData,
    );

    const client = new WorkflowClient();

    try {
      await client.runWorkflow(workflowData, selectedTabId, {
        onNodeStart: (nodeId: string) => {
          updateNodeStatus(nodeId, "running");
        },
        onNodeFinish: (nodeId: string, output: NodeOutput) => {
          updateNodeStatus(
            nodeId,
            output.status === "success" ? "success" : "error",
          );
        },
        onComplete: (context: ExecutionContext) => {
          setIsRunning(false);
          setIsStopping(false);
          showToast("Workflow completed successfully!", "success");
          console.log("Workflow context:", context);
        },
        onError: (error: string) => {
          setIsRunning(false);
          setIsStopping(false);
          showToast(`Workflow failed: ${error}`, "error");
          console.error("Workflow error:", error);
        },
      });
    } catch (error) {
      setIsRunning(false);
      setIsStopping(false);
      const msg = error instanceof Error ? error.message : String(error);
      showToast(`Failed to start workflow: ${msg}`, "error");
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
  ]);

  const handleStop = useCallback(async () => {
    const client = new WorkflowClient();

    try {
      setIsStopping(true);
      await client.stopWorkflow();
      showToast("Stopping workflow...", "success");
    } catch (error) {
      setIsStopping(false);
      const msg = error instanceof Error ? error.message : String(error);
      showToast(`Failed to stop workflow: ${msg}`, "error");
    }
  }, [showToast]);

  const handleClear = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear the workflow? This action cannot be undone.",
      )
    ) {
      clearFlow();
    }
  }, [clearFlow]);

  const handleNewWorkflow = useCallback(() => {
    if (
      window.confirm(
        "Create a new workflow? This will start a fresh canvas. Your current workflow is auto-saved.",
      )
    ) {
      const newId = generateId();

      setWorkflowId(newId);
      updateWorkflowMeta({
        id: newId,
        name: "Untitled Workflow",
        savedAt: new Date().toISOString(),
        autosave: true,
      });
      clearFlow();
      initializeStandardNodes();

      const initialData: WorkflowJSON = {
        meta: {
          id: newId,
          name: "Untitled Workflow",
          description: "",
          savedAt: new Date().toISOString(),
          allowedDomains: [],
          isWebMCP: false,
        },
        graph: {
          nodes: [
            {
              id: "start_node",
              type: NodeType.START,
              label: "Start",
              config: {
                title: "Start",
                description: "Workflow entry point.",
              },
              ui: { position: { x: 100, y: 100 } },
            },
          ],
          edges: [],
        },
      };

      saveWorkflow(newId, initialData);
      showToast("New workflow created!", "success");
    }
  }, [
    clearFlow,
    initializeStandardNodes,
    setWorkflowId,
    showToast,
    updateWorkflowMeta,
  ]);

  const handleLoadSaved = useCallback(() => {
    setShowSavedWorkflows(true);
  }, []);

  const handleWorkflowLoad = useCallback(
    async (id: string) => {
      setWorkflowId(id);

      const data = await loadWorkflow(id);
      if (data) {
        loadWorkflowData(data);
        showToast("Workflow loaded successfully", "success");
      } else {
        showToast("Failed to load workflow", "error");
      }
    },
    [loadWorkflowData, setWorkflowId, showToast],
  );

  return (
    <div className="h-full flex-1 flex flex-col rounded bg-gray-100 dark:bg-background relative">
      {/* Import Dialog */}
      {showImportDialog && (
        <ImportDialog
          setShowImportDialog={setShowImportDialog}
          importJson={importJson}
          setImportJson={setImportJson}
          handleImportSubmit={handleImportSubmit}
        />
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
          type={toast.type === "success" ? "success" : "error"}
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
          title={workflowMeta.name}
          onTitleChange={(name) => updateWorkflowMeta({ name })}
          selectedTabId={selectedTabId}
          setSelectedTabId={setSelectedTabId}
          tabs={tabs}
          theme={theme}
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
            onSave: handleSave,
          }}
          autosaveEnabled={!!workflowMeta.autosave}
        />
      </div>
    </div>
  );
};

export default WorkflowCanvas;
