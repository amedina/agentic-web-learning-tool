/**
 * External dependencies
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
/**
 * Internal dependencies
 */
import './index.css';
import SidePanel from './sidePanel';
import { ModelProvider } from './providers';


createRoot(document.getElementById('root')!).render(
	<ModelProvider>
		<StrictMode>
			<SidePanel />
		</StrictMode>
	</ModelProvider>
);
