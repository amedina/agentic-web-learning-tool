/**
 * External dependencies.
 */
import { SidebarProvider } from '@google-awlt/design-system';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { useEffect, useRef, useState } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
/**
 * Internal dependencies.
 */
import Sidebar from './sidebar';
import Main from './main';
import { transport } from '../devtools';
import ExtensionReloadNotification from './errorReloadNotification';
import useContextInvalidated from '../hooks/useContextInvalidated';

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

  const contextInvalidatedRef = useRef(null);
  const tabIdRef = useRef(chrome.devtools.inspectedWindow.tabId);
  const isChromeRuntimeAvailable = Boolean(chrome.runtime?.onMessage);
  const [contextInvalidatd, setContextInvalidated] = useState(false);

  const reloadTexts = useRef({
    displayText: isChromeRuntimeAvailable
      ? 'Looks like extension has been updated since devtool was open.'
      : 'Something went wrong.',
    buttonText: 'Refresh Panel',
  });
  useContextInvalidated(
    contextInvalidatedRef,
    contextInvalidatd,
    setContextInvalidated
  );

  return (
    <SidebarProvider placement="devtools" defaultSelectedMenuItem="tools">
      <div ref={contextInvalidatedRef} className="flex w-full h-screen">
        <Sidebar />
        <Main />
      </div>
      {contextInvalidatd && (
        <div
          className="flex flex-col items-center justify-center w-full h-full absolute"
          style={{ zIndex: 1000 }}
        >
          <ExtensionReloadNotification
            tabId={tabIdRef.current}
            texts={reloadTexts.current}
          />
        </div>
      )}
    </SidebarProvider>
  );
};
