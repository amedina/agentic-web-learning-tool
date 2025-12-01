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
import { client, transport } from '../../utils/transports';

createRoot(document.getElementById('root')!).render(
	<McpClientProvider client={client} transport={transport} opts={{}}>
		<StrictMode>
			<SidePanel />
		</StrictMode>
	</McpClientProvider>
);