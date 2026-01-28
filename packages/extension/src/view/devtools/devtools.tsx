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
import EventLoggerTable from './components/eventLoggerTable';
//@ts-ignore -- TODO: remove this.
import EventLogger from './components/eventLogger';

export const transport = new ExtensionClientTransport({
  portName: CONNECTION_NAMES.MCP_HOST,
});

// Connects to the extension service worker.
export const client = new Client({
  name: 'Extension DevTools',
  version: '1.0.0',
});

function DevTools() {
  return (
    <McpClientProvider client={client} transport={transport}>
      <main className="w-full h-screen">
        <EventLoggerTable />
        {/* {<EventLogger />} */}
      </main>
    </McpClientProvider>
  );
}

export default DevTools;
