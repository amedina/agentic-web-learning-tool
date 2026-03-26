/**
 * External dependencies
 */
import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';
import { SidebarProvider } from '@google-awlt/design-system';
import { useEffect } from 'react';
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
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
      if (message.type === 'still_there') {
        sendResponse({ status: 'yes', type: 'devtools' });
      }
    });
  }, []);
  return (
    <EventLogsProvider>
      <SidebarProvider placement="devtools" defaultSelectedMenuItem="tools">
        <Layout />
      </SidebarProvider>
    </EventLogsProvider>
  );
}

export default DevTools;
