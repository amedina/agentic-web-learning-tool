/**
 * External dependencies
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";

/**
 * Internal dependencies
 */
import { NodeType } from "@google-awlt/engine-core";
import Context, {
  FlowCleaner,
  type FlowEdgeType,
  type FlowNodeType,
} from "./context";
import { useApi } from "../api";
import {
  LanguageDetectorApiToolNode,
  PromptApiToolNode,
  ProofreaderApiToolNode,
  RewriterApiToolNode,
  SummarizerApiToolNode,
  TranslatorApiToolNode,
  WriterApiToolNode,
  AlertNotificationToolNode,
  DomInputToolNode,
  ConditionToolNode,
  StaticInputToolNode,
  LoopToolNode,
  ClipboardWriterNode,
  TextToSpeechNode,
  DomReplacementNode,
  FileCreatorNode,
  TooltipNode,
  StartNode,
  EndNode,
  DataTransformerToolNode,
  MathToolNode,
} from "../../components";

const FlowProvider = ({ children }: PropsWithChildren) => {
  const [nodes, setNodes] = useState<FlowNodeType[]>([]);
  const [edges, setEdges] = useState<FlowEdgeType[]>([]);
  const nodeTypes = useMemo(
    () => ({
      [NodeType.PROMPT_API]: PromptApiToolNode,
      [NodeType.WRITER_API]: WriterApiToolNode,
      [NodeType.REWRITER_API]: RewriterApiToolNode,
      [NodeType.PROOFREADER_API]: ProofreaderApiToolNode,
      [NodeType.TRANSLATOR_API]: TranslatorApiToolNode,
      [NodeType.LANGUAGE_DETECTOR_API]: LanguageDetectorApiToolNode,
      [NodeType.SUMMARIZER_API]: SummarizerApiToolNode,
      [NodeType.ALERT_NOTIFICATION]: AlertNotificationToolNode,
      [NodeType.DOM_INPUT]: DomInputToolNode,
      [NodeType.CONDITION]: ConditionToolNode,
      [NodeType.STATIC_INPUT]: StaticInputToolNode,
      [NodeType.LOOP]: LoopToolNode,
      [NodeType.CLIPBOARD_WRITER]: ClipboardWriterNode,
      [NodeType.TEXT_TO_SPEECH]: TextToSpeechNode,
      [NodeType.DOM_REPLACEMENT]: DomReplacementNode,
      [NodeType.FILE_CREATOR]: FileCreatorNode,
      [NodeType.TOOLTIP]: TooltipNode,
      [NodeType.START]: StartNode,
      [NodeType.END]: EndNode,
      [NodeType.DATA_TRANSFORMER]: DataTransformerToolNode,
      [NodeType.MATH]: MathToolNode,
    }),
    [],
  );
  const { removeNode, clearApiData } = useApi(({ actions }) => ({
    removeNode: actions.removeNode,
    clearApiData: actions.clearApiData,
  }));

  const [isRunning, setIsRunning] = useState(false);

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNodeType>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<FlowEdgeType>[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== id));
      removeNode(id);

      setEdges((prev) =>
        prev.filter((edge) => edge.source !== id && edge.target !== id),
      );
    },
    [removeNode],
  );

  const deleteEdge = useCallback((id: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== id));
  }, []);

  const onNodesDelete = useCallback(
    (deletedNodes: FlowNodeType[]) => {
      deletedNodes.forEach((node) => {
        deleteNode(node.id);
      });
    },
    [deleteNode],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: FlowEdgeType[]) => {
      deletedEdges.forEach((edge) => {
        deleteEdge(edge.id);
      });
    },
    [deleteEdge],
  );

  const onConnect = useCallback(
    (params: Connection | FlowEdgeType) =>
      setEdges((edgesSnapshot) => {
        const isTargetConnected = edgesSnapshot.some((edge) => {
          const sameTargetId = edge.target === params.target;

          const edgeTargetHandle = !edge.targetHandle ? "" : edge.targetHandle;
          const paramsTargetHandle = !params.targetHandle
            ? ""
            : params.targetHandle;

          return sameTargetId && edgeTargetHandle === paramsTargetHandle;
        });

        if (isTargetConnected) {
          return edgesSnapshot;
        }

        return addEdge(params, edgesSnapshot);
      }),
    [],
  );

  const addNode = useCallback((node: FlowNodeType) => {
    setNodes((prev) => [...prev, node]);
  }, []);

  const updateNodeStatus = useCallback(
    (id: string, status: "running" | "success" | "error" | undefined) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === id ? { ...node, status } : node)),
      );
    },
    [],
  );

  const clearFlow = useCallback(() => {
    clearApiData();
    setNodes([]);
    setEdges([]);
  }, [clearApiData]);

  return (
    <Context.Provider
      value={{
        state: {
          nodes,
          edges,
          nodeTypes,
          isRunning,
        },
        actions: {
          onNodesChange,
          onEdgesChange,
          onNodesDelete,
          onEdgesDelete,
          onConnect,
          addNode,
          deleteNode,
          updateNodeStatus,
          setIsRunning,
          clearFlow,
        },
      }}
    >
      <FlowCleaner />
      {children}
    </Context.Provider>
  );
};

export default FlowProvider;
