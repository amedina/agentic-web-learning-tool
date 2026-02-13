/**
 * External dependencies
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Internal dependencies
 */
import { useApi, type ApiNodeConfig } from "../../stateProviders";
import {
  PromptApiToolConfig,
  ProofreaderApiToolConfig,
  RewriterApiToolConfig,
  SummarizerApiToolConfig,
  TranslatorApiToolConfig,
  WriterApiToolConfig,
  DomInputToolConfig,
  StaticInputToolConfig,
  ConditionToolConfig,
  DomReplacementToolConfig,
  FileCreatorToolConfig,
  TooltipToolConfig,
  LoopToolConfig,
  DataTransformerToolConfig,
  MathToolConfig,
  AlertNotificationToolConfig,
  SelectionToolConfig,
} from "../tools";
import { WorkflowConfig } from "./workflowConfig";
import { ToolsConfig } from "../ui";
import { NodeType } from "@google-awlt/engine-core";

const TOOLS = {
  [NodeType.PROMPT_API]: PromptApiToolConfig,
  [NodeType.WRITER_API]: WriterApiToolConfig,
  [NodeType.REWRITER_API]: RewriterApiToolConfig,
  [NodeType.PROOFREADER_API]: ProofreaderApiToolConfig,
  [NodeType.TRANSLATOR_API]: TranslatorApiToolConfig,
  [NodeType.LANGUAGE_DETECTOR_API]: null,
  [NodeType.SUMMARIZER_API]: SummarizerApiToolConfig,
  [NodeType.ALERT_NOTIFICATION]: AlertNotificationToolConfig,
  [NodeType.DOM_INPUT]: DomInputToolConfig,
  [NodeType.SELECTION_TOOL]: SelectionToolConfig,
  [NodeType.CONDITION]: ConditionToolConfig,
  [NodeType.DATA_TRANSFORMER]: DataTransformerToolConfig,
  [NodeType.MATH]: MathToolConfig,
  [NodeType.STATIC_INPUT]: StaticInputToolConfig,
  [NodeType.LOOP]: LoopToolConfig,
  [NodeType.DOM_REPLACEMENT]: DomReplacementToolConfig,
  [NodeType.CLIPBOARD_WRITER]: null,
  [NodeType.FILE_CREATOR]: FileCreatorToolConfig,
  [NodeType.TEXT_TO_SPEECH]: null,
  [NodeType.TOOLTIP]: TooltipToolConfig,
  [NodeType.START]: null,
  [NodeType.END]: null,
};

interface ToolsConfigPanelProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const ToolsConfigPanel = ({
  collapsed = false,
  onToggle,
}: ToolsConfigPanelProps) => {
  const { selectedNode, getNode, updateNode } = useApi(
    ({ state, actions }) => ({
      selectedNode: state.selectedNode,
      getNode: actions.getNode,
      updateNode: actions.updateNode,
    }),
  );

  const [activeTab, setActiveTab] = useState<"node" | "workflow">("workflow");
  const [node, setNode] = useState<ApiNodeConfig>();
  const [config, setConfig] = useState<ApiNodeConfig["config"]>();

  const toolNodeRef = useRef<{
    getConfig: (formData: FormData) => ApiNodeConfig["config"] | undefined;
  }>(null);

  useEffect(() => {
    if (selectedNode) {
      const _node = getNode(selectedNode);
      setNode(_node);
      setActiveTab("node");
    } else {
      setNode(undefined);
    }
  }, [selectedNode, getNode]);

  useEffect(() => {
    setConfig(node?.config);
  }, [node]);

  const handleConfigUpdate = useCallback(
    (form: HTMLFormElement) => {
      const formData = new FormData(form);
      if (!node || !selectedNode) return;

      const toolConfig = toolNodeRef.current?.getConfig(formData);
      if (!toolConfig) {
        return;
      }

      updateNode(selectedNode, {
        config: toolConfig,
      });
    },
    [node, selectedNode, updateNode],
  );

  const handleChange = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      const form = e.currentTarget;

      handleConfigUpdate(form);
    },
    [handleConfigUpdate],
  );

  const Tool = node?.type
    ? (TOOLS[node.type as keyof typeof TOOLS] as React.ElementType)
    : null;

  const tabs = (
    <div className="flex border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-zinc-800 sticky top-0 z-10 w-full">
      <button
        type="button"
        className={`flex-1 py-3 text-sm font-medium transition-colors ${
          activeTab === "node"
            ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
            : "text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
        }`}
        onClick={() => setActiveTab("node")}
      >
        Node
      </button>
      <button
        type="button"
        className={`flex-1 py-3 text-sm font-medium transition-colors ${
          activeTab === "workflow"
            ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
            : "text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300"
        }`}
        onClick={() => setActiveTab("workflow")}
      >
        Workflow
      </button>
    </div>
  );

  const isWorkflowTab = activeTab === "workflow";

  return (
    <ToolsConfig
      selectedNodeId={isWorkflowTab ? null : selectedNode}
      suppressEmptyState={isWorkflowTab}
      nodeType={node?.type}
      nodeTitle={(config as any)?.title || ""}
      nodeContext={(config as any)?.context}
      nodeDescription={(node?.config as any)?.description}
      onTitleChange={(value) =>
        setConfig((prev: any) => ({ ...prev, title: value }))
      }
      onContextChange={
        (config as any)?.context !== undefined
          ? (value) =>
              setConfig((prev: any) => ({
                ...prev,
                context: value,
              }))
          : undefined
      }
      onFormChange={handleChange}
      collapsed={collapsed}
      onToggle={onToggle}
      tabs={tabs}
    >
      {isWorkflowTab ? (
        <WorkflowConfig />
      ) : (
        Tool && node && <Tool ref={toolNodeRef} config={node.config} />
      )}
    </ToolsConfig>
  );
};

export default ToolsConfigPanel;
