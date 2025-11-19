import { useCallback, useState, type PropsWithChildren } from 'react';
import Context, { ApiCleaner, type NodeConfig } from './context';

const ApiProvider = ({ children }: PropsWithChildren) => {
	const [nodes, setNodes] = useState<{
		[id: string]: NodeConfig;
	}>({});

	const getNode = useCallback(
		(id: string) => {
			return nodes[id];
		},
		[nodes]
	);

	const addNode = useCallback(
		(
			node: {
				id: string;
			} & NodeConfig
		) => {
			setNodes((prev) => ({
				...prev,
				[node.id]: {
					type: node.type,
					config: node.config,
				},
			}));
		},
		[]
	);

	const updateNode = useCallback(
		(
			id: string,
			updates: {
				config?: { [key: string]: any };
			}
		) => {
			setNodes((prev) => {
				if (!prev || !prev[id]) return prev;

				return {
					...prev,
					[id]: {
						...prev[id],
						...updates,
					},
				};
			});
		},
		[]
	);

	const removeNode = useCallback((id: string) => {
		setNodes((prev) => {
			if (!prev || !prev[id]) return prev;

			const updated = { ...prev };
			delete updated[id];
			return updated;
		});
	}, []);

	return (
		<Context.Provider
			value={{
				state: {
					nodes,
				},
				actions: {
					getNode,
					addNode,
					updateNode,
					removeNode,
				},
			}}
		>
			<ApiCleaner />
			{children}
		</Context.Provider>
	);
};

export default ApiProvider;
