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
import { Play, Square, Loader, ChevronDown } from "lucide-react";
import { useCallback } from "react";

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
            onLoadSaved={actions.onLoadSaved}
          />
          <div className="w-px h-6 bg-slate-300 dark:bg-border mx-1"></div>
          <input
            className="bg-slate-100 dark:bg-zinc-950 px-3 py-1 rounded text-sm font-medium text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all border border-transparent dark:border-border"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter workflow title..."
          />
        </div>

        <div className="flex items-center gap-4 mr-2">
          {!autosaveEnabled && (
            <button
              onClick={actions.onSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition-colors shadow-sm uppercase tracking-wider"
            >
              Save
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
      <div className="w-full flex-1 min-h-[400px]">
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
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <Controls position="top-right" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default Flow;
