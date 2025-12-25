/**
 * External dependencies
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
/**
 * Internal dependencies
 */
import './index.css';
import DevTools from './devtools';
import { SettingsProvider } from '../stateProviders';

createRoot(document.getElementById('root')!).render(
	<SettingsProvider view='devtools'>
		<StrictMode>
			<DevTools />
		</StrictMode>
	</SettingsProvider>
);
