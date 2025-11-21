/**
 * External dependencies
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
/**
 * Internal dependencies
 */
import './index.css';
import SidePanel from './sidePanel';
import { client, transport } from './components';

createRoot(document.getElementById('root')!).render(
	//@ts-expect-error -- api is not widely available
	<McpClientProvider client={client} transport={transport} opts={{}}>
		<StrictMode>
			<SidePanel />
		</StrictMode>
	</McpClientProvider>
);
