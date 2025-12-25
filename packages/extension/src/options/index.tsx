/**
 * External dependencies
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from '@xyflow/react';
import { initContentScriptBridge } from '@google-awlt/engine-extension';

/**
 * Internal dependencies
 */
import './index.css';
import OptionsPanel from './optionsPanel';
import { ApiProvider, FlowProvider } from './store';

// Initialize the bridge so workflows can run on the Options page itself
initContentScriptBridge();

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ApiProvider>
			<FlowProvider>
				<ReactFlowProvider>
					<OptionsPanel />
				</ReactFlowProvider>
			</FlowProvider>
		</ApiProvider>
	</StrictMode>
);
