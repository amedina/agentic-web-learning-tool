/**
 * External dependencies
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
/**
 * Internal dependencies
 */
import './index.css';
import Options from './options';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Options />
	</StrictMode>
);
