/**
 * External dependecies
 */
import { SidebarProvider } from '@google-awlt/design-system';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Internal dependencies
 */
import './index.css';
import Options from './options';

createRoot(document.getElementById('root')!).render(
	<div className="w-screen h-screen">
		<SidebarProvider>
			<StrictMode>
				<Options />
			</StrictMode>
		</SidebarProvider>
	</div>
);
