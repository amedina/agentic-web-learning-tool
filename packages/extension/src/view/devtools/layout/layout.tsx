/**
 * External dependencies.
 */
import { SidebarProvider } from '@google-awlt/design-system';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { useEffect } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
/**
 * Internal dependencies.
 */
import Sidebar from './sidebar';
import Main from './main';
import { transport } from '../devtools';

export const Layout = () => {
  const { client } = useMcpClient();
  useEffect(() => {
    // Synchronization Mechanism: This block listens for a "Tool Changed" event from the
    // Service Worker, and client.listTools() performs the actual "Refresh" to get the new data.
    transport.onmessage = async (message: JSONRPCMessage) => {
      if ('method' in message && message.method === 'get/Tools') {
        await client.listTools();
      }
    };
  }, [client]);

  return (
    <SidebarProvider placement="devtools" defaultSelectedMenuItem="tools">
      <div className="flex w-full h-screen">
        <Sidebar />
        <Main />
      </div>
    </SidebarProvider>
  );
};
