/**
 * External dependencies
 */
import { ReactFlowProvider } from '@xyflow/react';
import { initContentScriptBridge } from '@google-awlt/engine-extension';

/**
 * Internal dependencies
 */
import { ApiProvider, FlowProvider } from './store';
import Panel from './panel';

// Initialize the bridge so workflows can run on the Options page itself
initContentScriptBridge();

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
