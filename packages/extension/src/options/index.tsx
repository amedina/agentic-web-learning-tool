import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from '@xyflow/react';

import './index.css';
import OptionsPanel from './optionsPanel';
import FlowProvider from './store/flow/provider';
import { ApiProvider } from './store';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<FlowProvider>
			<ApiProvider>
				<ReactFlowProvider>
					<OptionsPanel />
				</ReactFlowProvider>
			</ApiProvider>
		</FlowProvider>
	</StrictMode>
);
