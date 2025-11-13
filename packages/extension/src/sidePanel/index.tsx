import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ClaudeContainer, client, transport } from './sidePanel';
import { McpClientProvider } from '@mcp-b/mcp-react-hooks';

createRoot(document.getElementById('root')!).render(
	<McpClientProvider client={client} transport={transport} opts={{}}>
		<StrictMode>
			<ClaudeContainer />
		</StrictMode>
	</McpClientProvider>
);
