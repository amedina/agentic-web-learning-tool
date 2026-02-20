/**
 * External dependencies
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import {
  getLastOpenedWorkflowId,
  WorkflowClient,
  saveWorkflow,
  loadWorkflow,
  deleteWorkflow,
  setLastOpenedWorkflowId,
  listWorkflows,
} from "@google-awlt/engine-extension";
import {
  type ExecutionContext,
  type NodeConfig,
  type NodeOutput,
  NodeType,
  type WorkflowJSON,
  WorkflowJSONSchema,
  type WorkflowMeta,
} from "@google-awlt/engine-core";

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
import { TOOL_CONFIGS } from "../tools/toolRegistry";
import logger from "../../logger";
import { getUniqueNames } from "../../utils/workflowUtils";

const ID_PREFIX = "wf_";
const STORAGE_KEY_SELECTED_TAB = "awl_wc_selected_tab_id";
const STORAGE_KEY_OPEN_WORKFLOWS = "awl_wc_open_workflows";

export interface OpenWorkflow {
  id: string;
  name: string;
}

const generateId = () => {
  const id = crypto.randomUUID();
  return `${ID_PREFIX}${id}`;
};

interface WorkflowCanvasProps {
  theme: "light" | "dark" | "system";
}

const WorkflowCanvas = ({ theme }: WorkflowCanvasProps) => {
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

  const [openWorkflows, _setOpenWorkflows] = useState<OpenWorkflow[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_OPEN_WORKFLOWS);
    return saved ? JSON.parse(saved) : [];
  });

  const setOpenWorkflows = useCallback((workflows: OpenWorkflow[]) => {
    _setOpenWorkflows(workflows);
    localStorage.setItem(STORAGE_KEY_OPEN_WORKFLOWS, JSON.stringify(workflows));
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

  useEffect(() => {
    const autoLoad = async () => {
      const lastId = await getLastOpenedWorkflowId();

      if (lastId) {
        const savedData = await loadWorkflow(lastId);
        if (savedData) {
          loadWorkflowData(savedData);
        }
      } else if (openWorkflows.length > 0) {
        const firstTab = openWorkflows[0];
        const savedData = await loadWorkflow(firstTab.id);
        if (savedData) {
          loadWorkflowData(savedData);
        }
      } else {
        initializeStandardNodes();

        const { name, sanitizedName } = await getUniqueNames("New Workflow");
        const newId = generateId();
        const newMeta: WorkflowMeta = {
          id: newId,
          name,
          sanitizedName,
          savedAt: new Date().toISOString(),
          autosave: true,
        };
        updateWorkflowMeta(newMeta, true);
        setOpenWorkflows([{ id: newId, name: newMeta.name }]);
      }
    };

    autoLoad();
  }, []);

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
        updateWorkflowMeta(workflowData.meta, true);
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

      setSelectedNode(null);
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

  const serializeWorkflow = useCallback(
    (
      currentNodes: FlowNodeType[],
      currentEdges: FlowEdgeType[],
      currentApiData: {
        [id: string]: ApiNodeConfig;
      },
    ): WorkflowJSON => {
      return {
        meta: {
          ...workflowMeta,
          id: workflowMeta?.id || generateId(),
          name: workflowMeta?.name || "Untitled Workflow",
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
      !workflowMeta?.id ||
      !workflowMeta.autosave ||
      workflowMeta.id.startsWith("demo-")
    )
      return;

    const timeoutId = setTimeout(() => {
      const workflowData = serializeWorkflow(nodes, edges, nodesApiData);

      saveWorkflow(workflowMeta.id, workflowData);
    }, 100); // Debounce save by 100ms

    return () => clearTimeout(timeoutId);
  }, [
    workflowMeta?.id,
    nodes,
    edges,
    nodesApiData,
    serializeWorkflow,
    workflowMeta?.autosave,
  ]);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const handleSave = useCallback(async () => {
    const isBuiltIn = workflowMeta?.id.startsWith("demo-");

    try {
      let saveId = workflowMeta?.id;
      let finalMeta: WorkflowMeta = workflowMeta;

      if (isBuiltIn && workflowMeta) {
        saveId = generateId();
        const baseName = workflowMeta.name.replace("Built-in: ", "");
        const { name, sanitizedName } = await getUniqueNames(baseName);

        finalMeta = {
          ...workflowMeta,
          id: saveId,
          name,
          sanitizedName,
          autosave: true,
          savedAt: new Date().toISOString(),
        };
      }

      const workflowData = serializeWorkflow(nodes, edges, nodesApiData);
      if (isBuiltIn) {
        workflowData.meta = finalMeta || workflowData.meta;
      }

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
        logger(["error"], ["Workflow validation failed:", validation.error]);

        return;
      }

      await saveWorkflow(saveId || workflowMeta?.id || "", workflowData);

      // If it was a built-in, update the tab in openWorkflows
      if (isBuiltIn && workflowMeta?.id && saveId) {
        updateWorkflowMeta(finalMeta, true);

        setOpenWorkflows([
          ...openWorkflows,
          {
            id: saveId,
            name: finalMeta.name,
          },
        ]);
      }

      showToast(
        isBuiltIn
          ? "Built-in workflow copied to your list!"
          : "Workflow saved successfully!",
        "success",
      );
    } catch (error) {
      logger(["error"], ["Failed to save workflow:", error]);
      showToast("Failed to save workflow", "error");
    }
  }, [
    workflowMeta,
    updateWorkflowMeta,
    serializeWorkflow,
    nodes,
    edges,
    nodesApiData,
    showToast,
  ]);

  const handleExport = useCallback(async () => {
    try {
      const workflowData = serializeWorkflow(nodes, edges, nodesApiData);

      const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        workflowMeta?.name.toLowerCase().replace(/\s+/g, "-") || "workflow"
      }.json`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Workflow exported as JSON file!", "success");
    } catch (error) {
      logger(["error"], ["Failed to export workflow:", error]);
      showToast("Failed to export workflow", "error");
    }
  }, [
    edges,
    nodes,
    nodesApiData,
    serializeWorkflow,
    showToast,
    workflowMeta?.name,
  ]);

  const handleImportSubmit = useCallback(async () => {
    try {
      const workflowData = JSON.parse(importJson);

      // Validate workflow data before importing
      const validation = WorkflowJSONSchema.safeParse(workflowData);
      if (!validation.success) {
        const errorMsg =
          "Failed to import workflow. Please check the JSON format.";

        showToast(errorMsg, "error");
        logger(
          ["error"],
          ["Workflow import validation failed:", validation.error],
        );

        return;
      }

      clearFlow();

      const { name, sanitizedName } = await getUniqueNames(
        workflowData.meta.name,
      );

      const resolvedWorkflowData = {
        ...workflowData,
        meta: {
          ...workflowData.meta,
          name,
          sanitizedName,
          id: workflowData.meta.id,
        },
      };

      loadWorkflowData(resolvedWorkflowData);
      saveWorkflow(workflowData.meta.id, resolvedWorkflowData);

      // Add to open workflows
      const exists = openWorkflows.some((wf) => wf.id === workflowData.meta.id);
      if (!exists) {
        setOpenWorkflows([
          ...openWorkflows,
          { id: workflowData.meta.id, name },
        ]);
      }

      setShowImportDialog(false);
      setImportJson("");
      showToast("Workflow imported successfully!", "success");
    } catch (error) {
      logger(["error"], ["Failed to import workflow:", error]);
      showToast("Invalid workflow JSON.", "error");
    }
  }, [clearFlow, importJson, loadWorkflowData, showToast]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    if (!selectedTabId) {
      showToast("Please select a tab to run on", "error");
      return;
    }

    setIsRunning(true);

    // Reset statuses
    nodes.forEach((node) => updateNodeStatus(node.id, undefined));

    const workflowData = serializeWorkflow(nodes, edges, nodesApiData);

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
          logger(["debug"], ["Workflow context:", context]);
        },
        onError: (error: string) => {
          setIsRunning(false);
          setIsStopping(false);
          showToast(`Workflow failed: ${error}`, "error");
          logger(["error"], ["Workflow error:", error]);
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
      initializeStandardNodes();
    }
  }, [clearFlow]);

  const handleNewWorkflow = useCallback(async () => {
    clearFlow();
    initializeStandardNodes();
    const newId = generateId();
    const { name, sanitizedName } = await getUniqueNames("New Workflow");

    const newMeta: WorkflowMeta = {
      id: newId,
      name,
      sanitizedName,
      savedAt: new Date().toISOString(),
      autosave: true,
    };

    updateWorkflowMeta(newMeta, true);
    showToast("New workflow created!", "success");
    setOpenWorkflows([...openWorkflows, { id: newId, name }]);
  }, [
    clearFlow,
    initializeStandardNodes,
    showToast,
    updateWorkflowMeta,
    openWorkflows,
    setOpenWorkflows,
  ]);

  const handleLoadSaved = useCallback(() => {
    setShowSavedWorkflows(true);
  }, []);

  const handleWorkflowLoad = useCallback(
    async (id: string, workflowData?: WorkflowJSON) => {
      let data = workflowData;

      if (!data) {
        const result = await loadWorkflow(id);
        data = result || undefined;
      }

      if (data) {
        loadWorkflowData(data);
        showToast("Workflow loaded successfully", "success");

        // UI Tabs Management
        const exists = openWorkflows.some((wf) => wf.id === id);
        if (!exists) {
          setOpenWorkflows([...openWorkflows, { id, name: data.meta.name }]);
        }
      } else {
        showToast("Failed to load workflow", "error");
      }
    },
    [loadWorkflowData, showToast, openWorkflows, setOpenWorkflows],
  );

  const handleWorkflowSwitch = useCallback(
    async (id: string) => {
      if (id === workflowMeta?.id) return;

      const data = await loadWorkflow(id);
      if (data) {
        loadWorkflowData(data);
      }
    },
    [workflowMeta?.id, loadWorkflowData],
  );

  const openWorkflowsRef = useRef(openWorkflows);

  useEffect(() => {
    openWorkflowsRef.current = openWorkflows;
  }, [openWorkflows]);

  const removeEmptyWorkflow = useCallback(
    async (activeWorkflowId: string, workflowJSON?: WorkflowJSON) => {
      const workflow = workflowJSON || (await loadWorkflow(activeWorkflowId));
      if (!workflow) return;

      const meta = workflow?.meta;
      const nodes = workflow?.graph.nodes;

      if (
        nodes.length === 2 &&
        nodes.every(
          (node) => node.type === NodeType.START || node.type === NodeType.END,
        ) &&
        !meta.description &&
        !meta.allowedDomains?.length &&
        meta.name === "New Workflow"
      ) {
        await deleteWorkflow(activeWorkflowId);

        localStorage.setItem(
          STORAGE_KEY_OPEN_WORKFLOWS,
          JSON.stringify(
            openWorkflowsRef.current.filter(
              (workflow) => workflow.id !== activeWorkflowId,
            ),
          ),
        );

        setLastOpenedWorkflowId(
          openWorkflowsRef.current.length > 0
            ? openWorkflowsRef.current[0].id
            : "",
        );

        return true;
      }

      return false;
    },
    [],
  );

  useEffect(() => {
    return () => {
      (async () => {
        let workflows = await listWorkflows();
        let removedWorkflows = [];

        for (const wf of workflows) {
          const success = await removeEmptyWorkflow(wf.meta.id);

          if (success) removedWorkflows.push(wf.meta.id);
        }

        const _openWorkflows = openWorkflowsRef.current.filter(
          (wf) => !removedWorkflows.includes(wf.id),
        );

        setOpenWorkflows(_openWorkflows);

        setLastOpenedWorkflowId(
          _openWorkflows.length > 0 ? _openWorkflows[0].id : "",
        );
      })();
    };
  }, []);

  const handleWorkflowClose = useCallback(
    async (id: string) => {
      if (openWorkflows.length === 1) {
        if (
          window.confirm(
            "Closing the last tab will create a new workflow. Continue?",
          )
        ) {
          clearFlow();
          initializeStandardNodes();
          const newId = generateId();
          const { name, sanitizedName } = await getUniqueNames("New Workflow");

          const newMeta: WorkflowMeta = {
            id: newId,
            name,
            sanitizedName,
            savedAt: new Date().toISOString(),
            autosave: true,
          };

          updateWorkflowMeta(newMeta, true);
          setOpenWorkflows([{ id: newId, name: newMeta.name }]);
          showToast("New workflow created!", "success");
        }

        return;
      }

      removeEmptyWorkflow(id);

      const newOpenWorkflows = openWorkflows.filter((wf) => wf.id !== id);
      setOpenWorkflows(newOpenWorkflows);

      // If we closed the active workflow, switch to another one
      if (id === workflowMeta?.id && newOpenWorkflows.length > 0) {
        handleWorkflowSwitch(newOpenWorkflows[0].id);
      }
    },
    [
      openWorkflows,
      setOpenWorkflows,
      removeEmptyWorkflow,
      workflowMeta?.id,
      handleWorkflowSwitch,
      clearFlow,
      initializeStandardNodes,
      updateWorkflowMeta,
      showToast,
    ],
  );

  const onTitleChange = useCallback(
    async (newName: string) => {
      if (workflowMeta) {
        const { name, sanitizedName } = await getUniqueNames(
          newName,
          workflowMeta.id,
        );

        updateWorkflowMeta({
          name,
          sanitizedName,
        });

        // Also update tab name
        setOpenWorkflows(
          openWorkflows.map((wf) =>
            wf.id === workflowMeta.id ? { ...wf, name } : wf,
          ),
        );
      }
    },
    [workflowMeta, updateWorkflowMeta, openWorkflows, setOpenWorkflows],
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
        openWorkflows={openWorkflows}
        setOpenWorkflows={setOpenWorkflows}
        onNew={handleNewWorkflow}
        updateWorkflowMeta={updateWorkflowMeta}
        activeWorkflowId={workflowMeta?.id || ""}
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
          title={workflowMeta?.name || ""}
          onTitleChange={onTitleChange}
          selectedTabId={selectedTabId}
          setSelectedTabId={setSelectedTabId}
          tabs={tabs}
          theme={theme}
          isRunning={isRunning}
          isStopping={isStopping}
          openWorkflows={openWorkflows}
          activeWorkflowId={workflowMeta?.id || ""}
          onSwitchWorkflow={handleWorkflowSwitch}
          onCloseWorkflow={handleWorkflowClose}
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
          autosaveEnabled={!!workflowMeta?.autosave}
          isBuiltIn={workflowMeta?.id.startsWith("demo-")}
        />
      </div>
    </div>
  );
};

export default WorkflowCanvas;
