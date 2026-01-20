/**
 * External dependencies
 */
import { ReactFlowProvider } from '@xyflow/react';

/**
 * Internal dependencies
 */
import { ApiProvider, FlowProvider } from './store';
import Panel from './panel';

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
