/**
 * External dependencies
 */
import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  ToolListChangedNotificationSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Internal dependencies
 */
import {
  CONNECTION_NAMES,
  MESSAGE_TYPES,
  setLogLevelFromSyncSettings,
  logger,
} from '../utils';
// Inject it in the content script before everything to get loglevel settings.
// Using IIFE to prevent content script from breaking due to top level await.
(async () => await setLogLevelFromSyncSettings())();

let connectionStarted = false;

interface ToolUpdateMessage {
  type: string;
  tools: Tool[];
  url: string;
}

try {
  (async () => {
    if (window !== window.top) {
      return;
    }

    try {
      const polyfillScript = document.createElement('script');
      polyfillScript.src = chrome.runtime.getURL(
        'contentScript/webmcp-polyfill.js'
      );
      polyfillScript.onload = () => polyfillScript.remove();
      (document.head || document.documentElement).appendChild(polyfillScript);
      logger(['debug'], ['WebMCP: Injected webmcp-polyfill.js']);
    } catch (e) {
      logger(['error'], ['WebMCP: Failed to inject webmcp-polyfill.js', e]);
    }

    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('contentScript/registerTools.js');
      script.onload = () => script.remove();
      (document.head || document.documentElement).appendChild(script);
      logger(['debug'], ['WebMCP: Injected registerTools.js']);
    } catch (e) {
      logger(['error'], ['WebMCP: Failed to inject registerTools.js', e]);
    }

    async function setupToolChangeListener() {
      if (!client) {
        return;
      }

      const capabilities = client.getServerCapabilities();

      logger(
        ['debug'],
        [
          '[MCP Proxy] Server supports tool list change notifications',
          capabilities,
        ]
      );
      client.setNotificationHandler(
        ToolListChangedNotificationSchema,
        async () => {
          logger(
            ['error'],
            ['[MCP Proxy] Received tool list change notification']
          );
          await sendToolUpdate(MESSAGE_TYPES.UPDATE);
        }
      );
    }

    /**
     * Fetches current tools and sends an update message to the background port.
     * @param updateType - The event type identifier (e.g., "tools-updated")
     */
    async function sendToolUpdate(updateType: string) {
      if (!backgroundPort) {
        logger(
          ['warn'],
          ['[MCP Proxy] No background port to send tool update']
        );
        return;
      }

      try {
        const { tools } = await client.listTools();

        logger(
          ['debug'],
          [`[MCP Proxy] Sending ${tools.length} tools with type: ${updateType}`]
        );

        const message: ToolUpdateMessage = {
          type: updateType,
          tools: tools,
          url: window.location.href,
        };
        backgroundPort.postMessage({
          type: 'register-tools',
          tools: tools,
        });

        backgroundPort.postMessage(message);
      } catch (error) {
        logger(['error'], ['[MCP Proxy] Failed to send tool update:', error]);
      }
    }

    // This connects to the page context since content scripts have a separate JS context
    // TabClientTransport uses window.postMessage under the hood. The TabServerTransport is implemented from the MCP-B polyfill
    const transport = new TabClientTransport({
      targetOrigin: window.location.origin,
    });

    const client = new Client({
      name: 'ExtensionProxyClient',
      version: '1.0.0',
    });

    const backgroundPort = chrome.runtime.connect({
      name: CONNECTION_NAMES.CONTENT_SCRIPT,
    });

    // Moved storage get to top level (already there in previous replacement, but ensuring order)

    //Need to set interval because the TabServerTransport might not be ready to accept connections yet
    const interval = setInterval(async () => {
      try {
        if (!client.transport && !connectionStarted) {
          try {
            await client.connect(transport);
            connectionStarted = true;
          } catch (error) {
            logger(['error'], [`Error connecting client: ${error}`]);
          }
        }
        if (client.transport) {
          clearInterval(interval);
          setupToolChangeListener();

          // client.listTools sends message to TabServerTransport which is implemented by the MCP-B polyfill in real world page context.
          // @see https://github.com/WebMCP-org/npm-packages/blob/a262b42b7dc260f47f6fbc5b6dd82937ec01fb83/global/src/global.ts#L2167-L2170
          const pageTools = await client.listTools();
          //Send initial list of tools to service worker
          backgroundPort.postMessage({
            type: 'register-tools',
            tools: pageTools.tools,
          });
        }
      } catch (error) {
        logger(['error'], [`Error connecting to MCP background:${error}`]);
      }
    }, 1000);

    // Listen for messages from service worker.
    backgroundPort.onMessage.addListener(async (message) => {
      if (message.type === 'execute-tool') {
        const result = await client.callTool({
          name: message.toolName,
          arguments: message.args || {},
        });

        backgroundPort.postMessage({
          type: 'tool-result',
          requestId: message.requestId,
          data: { success: true, payload: result },
        });
      }
    });

    transport.onclose = () => {
      if (!chrome.runtime?.id) {
        return;
      }

      backgroundPort.disconnect();
    };

    backgroundPort.onDisconnect.addListener(() => {
      if (!chrome.runtime?.id) {
        return;
      }

      transport.close();
    });
  })();
} catch (error) {
  logger(['error'], [`Error connecting to MCP background:${error}`]);
}
