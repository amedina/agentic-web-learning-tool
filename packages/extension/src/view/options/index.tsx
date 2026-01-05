/**
 * External dependecies
 */
import { SidebarProvider, Toaster } from '@google-awlt/design-system';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/**
 * Internal dependencies
 */
import './index.css';
import Options from './options';
import { SettingsProvider } from '../stateProviders';
import { ModelProvider, ToolProvider } from './providers';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<div className="w-screen h-screen">
			<ModelProvider>
				<ToolProvider>
					<SettingsProvider view="options">
						<Toaster position="top-center" />
						<SidebarProvider>
							<Options />
						</SidebarProvider>
					</SettingsProvider>
				</ToolProvider>
			</ModelProvider>
		</div>
	</StrictMode>
);
