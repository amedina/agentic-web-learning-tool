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

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<DevTools />
	</StrictMode>
);
