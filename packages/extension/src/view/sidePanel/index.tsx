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
import { SettingsProvider } from '../stateProviders';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ModelProvider>
			<SettingsProvider view="sidepanel">
				<SidePanel />
			</SettingsProvider>
		</ModelProvider>
	</StrictMode>
);
