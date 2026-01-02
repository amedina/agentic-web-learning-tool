/**
 * External dependencies
 */
import { ReactFlowProvider } from '@xyflow/react';

/**
 * Internal dependencies
 */
import Panel from './panel';
import FlowProvider from './store/flow/provider';
import { ApiProvider } from './store';

const Workflow = () => {
	return (
		<ApiProvider>
			<FlowProvider>
				<ReactFlowProvider>
					<Panel />
				</ReactFlowProvider>
			</FlowProvider>
		</ApiProvider>
	);
};

export default Workflow;
