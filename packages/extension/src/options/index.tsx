import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import OptionsPanel from './optionsPanel';
import FlowProvider from './store/flow/provider';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<FlowProvider>
			<OptionsPanel />
		</FlowProvider>
	</StrictMode>
);
