/**
 * External dependencies
 */
import {
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Play,
  Square,
  Loader,
  ChevronDown,
  X,
  Save,
  CopyPlus,
  Plus,
  GalleryHorizontalEnd,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import WorkflowDropdown from "./workflowDropdown";

export interface FlowProps<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
> {
  nodes: NodeType[];
  edges: EdgeType[];
  nodeTypes?: any;
  onNodesChange: OnNodesChange<NodeType>;
  onEdgesChange: OnEdgesChange<EdgeType>;
  onConnect: OnConnect;
  onNodesDelete?: (nodes: NodeType[]) => void;
  onEdgesDelete?: (edges: EdgeType[]) => void;
  title: string;
  onTitleChange: (title: string) => void;
  selectedTabId: number | null;
  setSelectedTabId: (tabId: number | null) => void;
  tabs: chrome.tabs.Tab[];
  isRunning: boolean;
  isStopping?: boolean;
  theme: "light" | "dark" | "system";
  autosaveEnabled?: boolean;
  actions: {
    onImport: () => void;
    onExport: () => void;
    onClear: () => void;
    onNew: () => void;
    onRun: () => void;
    onStop: () => void;
    onDrop: (event: React.DragEvent) => void;
    onLoadSaved: () => void;
    onRefreshTabs: () => void;
    onSave: () => void;
  };
  isBuiltIn?: boolean;
  openWorkflows: { id: string; name: string }[];
  activeWorkflowId: string;
  onSwitchWorkflow: (id: string) => void;
  onCloseWorkflow: (id: string) => void;
}

const Flow = <NodeType extends Node, EdgeType extends Edge>({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodesDelete,
  onEdgesDelete,
  title,
  onTitleChange,
  selectedTabId,
  setSelectedTabId,
  autosaveEnabled,
  tabs,
  theme,
  isRunning,
  isStopping,
  actions,
  isBuiltIn,
  openWorkflows,
  activeWorkflowId,
  onSwitchWorkflow,
  onCloseWorkflow,
}: FlowProps<NodeType, EdgeType>) => {
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      actions.onDrop(event);
    },
    [actions],
  );

  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const onToggleMinimap = useCallback(() => {
    setIsMinimapVisible((isVisible) => !isVisible);
  }, []);

  useEffect(() => {
    if (activeWorkflowId && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const activeTab = container.querySelector(
        '[data-state="active"]',
      ) as HTMLElement;

      if (activeTab) {
        activeTab.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [activeWorkflowId]);

  return (
    <div className="h-full flex-1 flex flex-col rounded bg-gray-100 dark:bg-slate-950 relative min-h-[500px]">
      <div
        className="h-15 bg-gray-200 dark:bg-zinc-900 flex items-center justify-between px-2 border-b border-slate-300 dark:border-border p-2"
        onMouseEnter={actions.onRefreshTabs}
      >
        <div className="flex items-center gap-2">
          <WorkflowDropdown
            onNew={actions.onNew}
            onImport={actions.onImport}
            onExport={actions.onExport}
            onClear={actions.onClear}
          />
          <button
            onClick={actions.onLoadSaved}
            className="flex items-center justify-center p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-foreground transition-all rounded-md"
            title="Workflow Library"
          >
            <GalleryHorizontalEnd size={20} />
          </button>
          <div className="w-px h-6 bg-slate-300 dark:bg-border mx-1"></div>
          <input
            className="bg-slate-100 dark:bg-zinc-950 px-3 py-1 rounded text-sm font-medium text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all border border-transparent dark:border-border disabled:opacity-80 disabled:cursor-not-allowed"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter workflow title..."
            disabled={isBuiltIn}
          />
        </div>

        <div className="flex items-center gap-4 mr-2">
          {!autosaveEnabled && !isBuiltIn && (
            <button
              onClick={actions.onSave}
              className="flex items-center justify-center p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-foreground transition-all rounded-md"
              title="Save Workflow"
            >
              <Save size={20} />
            </button>
          )}

          {isBuiltIn && (
            <button
              onClick={actions.onSave}
              className="flex items-center justify-center p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-foreground transition-all rounded-md"
              title="Save a copy to your workflows"
            >
              <CopyPlus size={20} />
            </button>
          )}

          <div className="w-px h-8 bg-slate-300 dark:bg-border"></div>

          <div className="flex items-center bg-white dark:bg-zinc-800 rounded-md border border-slate-300 dark:border-border shadow-sm overflow-hidden">
            <button
              onClick={isRunning ? actions.onStop : actions.onRun}
              disabled={isStopping}
              className={`flex items-center justify-center w-10 h-10 transition-all duration-200 ${
                isStopping
                  ? "bg-red-400 dark:bg-red-900/50 cursor-wait text-white"
                  : isRunning
                    ? "bg-red-500 hover:bg-red-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
              }`}
              title={
                isStopping
                  ? "Cancelling flow execution..."
                  : isRunning
                    ? "Stop Workflow"
                    : "Run Workflow"
              }
            >
              {isStopping ? (
                <Loader size={18} className="animate-spin" />
              ) : isRunning ? (
                <Square
                  size={16}
                  fill="currentColor"
                  className="animate-pulse"
                />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
            </button>

            <div className="relative flex items-center px-1 bg-transparent group">
              <select
                id="tab-select"
                value={selectedTabId || ""}
                onChange={(e) => setSelectedTabId(Number(e.target.value))}
                onFocus={actions.onRefreshTabs}
                onMouseEnter={actions.onRefreshTabs}
                className="text-xs bg-transparent border-none focus:ring-0 text-slate-700 dark:text-zinc-300 font-bold uppercase tracking-tight w-[160px] truncate cursor-pointer py-2 appearance-none pr-6 pl-3"
              >
                <option
                  value=""
                  disabled
                  className="dark:bg-zinc-900 font-sans normal-case"
                >
                  Target Tab
                </option>
                {tabs.map((tab) => (
                  <option
                    key={tab.id}
                    value={tab.id}
                    className="dark:bg-zinc-900 font-sans normal-case"
                  >
                    {tab.title || tab.url || `Tab ${tab.id}`}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 pointer-events-none text-slate-400 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Tabs */}
      {openWorkflows.length > 0 && (
        <div
          ref={tabsContainerRef}
          className="bg-gray-200 dark:bg-zinc-900 border-b border-slate-300 dark:border-border overflow-x-auto no-scrollbar"
        >
          <Tabs
            value={activeWorkflowId}
            onValueChange={(val) => onSwitchWorkflow(val)}
          >
            <TabsList className="h-9 bg-transparent p-0 gap-0 justify-start rounded-none border-b-0">
              {openWorkflows.map((wf) => (
                <TabsTrigger
                  key={wf.id}
                  value={wf.id}
                  className="h-9 px-3 pr-8 relative group data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-none border-r border-l border-l-transparent border-slate-300 dark:border-border -ml-px first:ml-0 rounded-none text-xs font-semibold normal-case min-w-[100px] hover:bg-slate-300/50 dark:hover:bg-zinc-800/50 data-[state=active]:hover:bg-gray-100 dark:data-[state=active]:hover:bg-slate-950 transition-colors data-[state=active]:border-t-2 data-[state=active]:border-t-indigo-500 data-[state=active]:border-l-slate-300 dark:data-[state=active]:border-l-border data-[state=active]:top-[1px] data-[state=active]:z-10"
                >
                  <span className="max-w-[120px] truncate">{wf.name}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseWorkflow(wf.id);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Close workflow"
                  >
                    <X size={10} />
                  </span>
                </TabsTrigger>
              ))}

              <TabsTrigger
                value="new"
                className="h-9 px-2 relative group data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-none border-r border-l border-l-transparent border-slate-300 dark:border-border -ml-px first:ml-0 rounded-none text-xs font-semibold normal-case hover:bg-slate-300/50 dark:hover:bg-zinc-800/50 data-[state=active]:hover:bg-gray-100 dark:data-[state=active]:hover:bg-slate-950 transition-colors data-[state=active]:border-t-2 data-[state=active]:border-t-indigo-500 data-[state=active]:border-l-slate-300 dark:data-[state=active]:border-l-border data-[state=active]:top-[1px] data-[state=active]:z-10"
              >
                <Plus size={16} onClick={actions.onNew} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      <div className="w-full flex-1 min-h-[400px]">
        <button
          onClick={onToggleMinimap}
          className="absolute z-1000 bg-white dark:bg-zinc-800 px-3 py-1 text-sm font-medium text-slate-600 dark:text-zinc-300 bottom-0 right-0"
        >
          {isMinimapVisible ? "Hide Minimap" : "Show Minimap"}
        </button>
        <ReactFlow<NodeType, EdgeType>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          colorMode={theme}
        >
          {isMinimapVisible && (
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          )}
          <Controls position="top-right" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default Flow;
