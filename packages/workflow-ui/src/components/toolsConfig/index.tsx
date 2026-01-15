/**
 * External dependencies
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Internal dependencies
 */
import { useApi, type NodeConfig } from "../../stateProviders";
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
} from "../tools";
import { ToolsConfig as ToolsConfigComponent } from "../ui";
import { WorkflowConfig } from "./workflowConfig";

const TOOLS = {
  promptApi: PromptApiToolConfig,
  writerApi: WriterApiToolConfig,
  rewriterApi: RewriterApiToolConfig,
  proofreaderApi: ProofreaderApiToolConfig,
  translatorApi: TranslatorApiToolConfig,
  languageDetectorApi: null,
  summarizerApi: SummarizerApiToolConfig,
  alertNotification: AlertNotificationToolConfig,
  domInput: DomInputToolConfig,
  condition: ConditionToolConfig,
  dataTransformer: DataTransformerToolConfig,
  math: MathToolConfig,
  staticInput: StaticInputToolConfig,
  loop: LoopToolConfig,
  domReplacement: DomReplacementToolConfig,
  clipboardWriter: null,
  fileCreator: FileCreatorToolConfig,
  textToSpeech: null,
  tooltip: TooltipToolConfig,
  start: null,
  end: null,
};

interface ToolsConfigProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const ToolsConfig = ({ collapsed = false, onToggle }: ToolsConfigProps) => {
  const { selectedNode, getNode, updateNode } = useApi(
    ({ state, actions }) => ({
      selectedNode: state.selectedNode,
      getNode: actions.getNode,
      updateNode: actions.updateNode,
    }),
  );

  const [activeTab, setActiveTab] = useState<"node" | "workflow">("node");
  const [node, setNode] = useState<NodeConfig>();
  const [config, setConfig] = useState<NodeConfig["config"]>();

  const toolNodeRef = useRef<{
    getConfig: (formData: FormData) => NodeConfig["config"] | undefined;
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
    <div className="flex border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-zinc-800/80 sticky top-0 z-10 w-full">
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
    <ToolsConfigComponent
      selectedNodeId={isWorkflowTab ? null : selectedNode}
      suppressEmptyState={isWorkflowTab}
      nodeType={node?.type}
      nodeLabel={(config as any)?.title || ""}
      nodeContext={(config as any)?.context}
      nodeDescription={(node?.config as any)?.description}
      onLabelChange={(value) =>
        setConfig((prev: any) => ({ ...prev, title: value }))
      }
      onContextChange={
        (config as any)?.context !== undefined
          ? (value) =>
              setConfig((prev) => ({
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
    </ToolsConfigComponent>
  );
};

export default ToolsConfig;
