/**
 * External dependencies
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';

/**
 * Internal dependencies
 */
import Context, { FlowCleaner, type EdgeType, type NodeType } from './context';
import { useApi } from '../api';
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
} from '../../components';

const FlowProvider = ({ children }: PropsWithChildren) => {
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const nodeTypes = useMemo(
    () => ({
      promptApi: PromptApiToolNode,
      writerApi: WriterApiToolNode,
      rewriterApi: RewriterApiToolNode,
      proofreaderApi: ProofreaderApiToolNode,
      translatorApi: TranslatorApiToolNode,
      languageDetectorApi: LanguageDetectorApiToolNode,
      summarizerApi: SummarizerApiToolNode,
      alertNotification: AlertNotificationToolNode,
      domInput: DomInputToolNode,
      condition: ConditionToolNode,
      staticInput: StaticInputToolNode,
      loop: LoopToolNode,
      clipboardWriter: ClipboardWriterNode,
      textToSpeech: TextToSpeechNode,
      domReplacement: DomReplacementNode,
      fileCreator: FileCreatorNode,
      tooltip: TooltipNode,
    }),
    []
  );
  const { removeNode, clearApiData } = useApi(({ actions }) => ({
    removeNode: actions.removeNode,
    clearApiData: actions.clearApiData,
  }));

  const [isRunning, setIsRunning] = useState(false);

  const onNodesChange = useCallback(
    (changes: NodeChange<NodeType>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<EdgeType>[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== id));
      removeNode(id);

      setEdges((prev) =>
        prev.filter((edge) => edge.source !== id && edge.target !== id)
      );
    },
    [removeNode]
  );

  const deleteEdge = useCallback((id: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== id));
  }, []);

  const onNodesDelete = useCallback(
    (deletedNodes: NodeType[]) => {
      deletedNodes.forEach((node) => {
        deleteNode(node.id);
      });
    },
    [deleteNode]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: EdgeType[]) => {
      deletedEdges.forEach((edge) => {
        deleteEdge(edge.id);
      });
    },
    [deleteEdge]
  );

  const onConnect = useCallback(
    (params: Connection | EdgeType) =>
      setEdges((edgesSnapshot) => {
        const isTargetConnected = edgesSnapshot.some((edge) => {
          const sameTargetId = edge.target === params.target;

          const edgeTargetHandle = !edge.targetHandle ? '' : edge.targetHandle;
          const paramsTargetHandle = !params.targetHandle
            ? ''
            : params.targetHandle;

          return sameTargetId && edgeTargetHandle === paramsTargetHandle;
        });

        if (isTargetConnected) {
          return edgesSnapshot;
        }

        return addEdge(params, edgesSnapshot);
      }),
    []
  );

  const addNode = useCallback((node: NodeType) => {
    setNodes((prev) => [...prev, node]);
  }, []);

  const updateNodeStatus = useCallback(
    (id: string, status: 'running' | 'success' | 'error' | undefined) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === id ? { ...node, status } : node))
      );
    },
    []
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
