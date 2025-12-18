/**
 * External dependencies
 */
import { ReactFlowProvider, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/**
 * Internal dependencies
 */
import FlowContext, { FlowCleaner } from '../store/flow/context';
import ApiContext, { ApiCleaner } from '../store/api/context';

export const withStore = (Story: any, { parameters }: any) => {
	const { flowStore, apiStore } = parameters;

	const mockFlowState = {
		state: {
			nodes: flowStore?.nodes || [],
			edges: flowStore?.edges || [],
			nodeTypes: flowStore?.nodeTypes || {},
		},
		actions: {
			onNodesChange: () => {},
			onEdgesChange: () => {},
			onNodesDelete: () => {},
			onEdgesDelete: () => {},
			onConnect: () => {},
			addNode: () => {},
			deleteNode: () => {},
			clearFlow: () => {},
			...flowStore?.actions,
		},
	};

	const mockApiState = {
		state: {
			nodes: apiStore?.nodes || {},
			selectedNode: apiStore?.selectedNode || null,
		},
		actions: {
			getNode: (id: string) => apiStore?.nodes?.[id],
			addNode: () => {},
			updateNode: () => {},
			removeNode: () => {},
			setSelectedNode: () => {},
			clearApiData: () => {},
			...apiStore?.actions,
		},
	};

	const nodes = Object.entries(apiStore?.nodes || {}).map(
		([id, node]: [string, any]) => ({
			id,
			type: node.type,
			position: { x: 50, y: 50 },
			data: { ...node.config },
		})
	);

	const nodeTypes = {
		[apiStore?.nodes?.[Object.keys(apiStore?.nodes || {})[0]]?.type]: Story,
	};

	return (
		<ApiContext.Provider value={mockApiState as any}>
			<ApiCleaner />
			<FlowContext.Provider value={mockFlowState as any}>
				<FlowCleaner />
				<ReactFlowProvider>
					<div
						style={{
							width: '100vw',
							height: '100vh',
						}}
					>
						<ReactFlow
							nodes={nodes}
							nodeTypes={nodeTypes}
							fitView
							style={{ background: '#f8fafc' }}
						/>
					</div>
				</ReactFlowProvider>
			</FlowContext.Provider>
		</ApiContext.Provider>
	);
};
