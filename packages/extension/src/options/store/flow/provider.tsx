import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	type Connection,
	type EdgeChange,
	type NodeChange,
} from '@xyflow/react';
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
		}),
		[]
	);
	const { removeNode } = useApi(({ actions }) => ({
		removeNode: actions.removeNode,
	}));

	const onNodesChange = useCallback(
		(changes: NodeChange<NodeType>[]) =>
			setNodes((nodesSnapshot) =>
				applyNodeChanges(changes, nodesSnapshot)
			),
		[]
	);
	const onEdgesChange = useCallback(
		(changes: EdgeChange<EdgeType>[]) =>
			setEdges((edgesSnapshot) =>
				applyEdgeChanges(changes, edgesSnapshot)
			),
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
			setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
		[]
	);

	const addNode = useCallback((node: NodeType) => {
		setNodes((prev) => [...prev, node]);
	}, []);

	const clearFlow = useCallback(() => {
		nodes.forEach((node) => {
			deleteNode(node.id);
		});

		setEdges([]);
	}, [deleteNode, nodes]);

	return (
		<Context.Provider
			value={{
				state: {
					nodes,
					edges,
					nodeTypes,
				},
				actions: {
					onNodesChange,
					onEdgesChange,
					onNodesDelete,
					onEdgesDelete,
					onConnect,
					addNode,
					deleteNode,
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
