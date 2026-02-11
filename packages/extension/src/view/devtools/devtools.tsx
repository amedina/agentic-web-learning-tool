/**
 * External dependencies
 */
import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';

/**
 * Internal dependencies
 */
import { CONNECTION_NAMES } from '../../utils';
import { Layout } from './layout';
import { EventLogsProvider } from './providers';

export const transport = new ExtensionClientTransport({
  portName:
    CONNECTION_NAMES.MCP_HOST_DEVTOOLS +
    chrome.devtools.inspectedWindow.tabId.toString(),
});

// Connects to the extension service worker.
export const client = new Client({
  name: 'Extension DevTools',
  version: '1.0.0',
});

function DevTools() {
  return (
    <EventLogsProvider>
      <McpClientProvider client={client} transport={transport}>
        <Layout />
      </McpClientProvider>
    </EventLogsProvider>
  );
}

export default DevTools;
