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
import { START_MCP_CONNECTION } from '../constants';
// Inject it in the content script before everything to get loglevel settings.
// Using promise catch instead of IIFE to prevent content script from breaking due to top level await.
setLogLevelFromSyncSettings().catch((e) =>
  logger(['error'], ['Failed to set log level', e])
);

let connectionStarted = false;

interface ToolUpdateMessage {
  type: string;
  tools: Tool[];
  url: string;
}

function insertAndRegisterScripts() {
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

  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(
      'contentScript/registerWorkflowTools.js'
    );
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
    logger(['debug'], ['WebMCP: Injected registerWorkflowTools.js']);
  } catch (e) {
    logger(['error'], ['WebMCP: Failed to inject registerWorkflowTools.js', e]);
  }
}

insertAndRegisterScripts();

const mcpConnectionInitialiser = (refreshTools = false) => {
  if (window !== window.top) {
    return Promise.resolve();
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

  const setupTransportAndConnectClient = () => {
    if (client.transport) {
      return;
    }
    // Moved storage get to top level (already there in previous replacement, but ensuring order)
    //Need to set interval because the TabServerTransport might not be ready to accept connections yet
    const interval = setInterval(() => {
      if (!client.transport && !connectionStarted) {
        client
          .connect(transport)
          .then(() => {
            connectionStarted = true;
          })
          .catch((error) => {
            logger(['error'], [`Error connecting client: ${error}`]);
          });
      }

      if (client.transport) {
        clearInterval(interval);
        setupToolChangeListener().then(() => {
          // client.listTools sends message to TabServerTransport which is implemented by the MCP-B polyfill in real world page context.
          // @see https://github.com/WebMCP-org/npm-packages/blob/a262b42b7dc260f47f6fbc5b6dd82937ec01fb83/global/src/global.ts#L2167-L2170
          client
            .listTools()
            .then((pageTools) => {
              //Send initial list of tools to service worker
              backgroundPort.postMessage({
                type: 'register-tools',
                tools: pageTools.tools,
              });
            })
            .catch((error) => {
              logger(
                ['error'],
                [`Error connecting to MCP background:${error}`]
              );
            });
        });
      }
    }, 1000);

    // Listen for messages from service worker.
    backgroundPort.onMessage.addListener((message) => {
      if (message.type === 'execute-tool') {
        client
          .callTool({
            name: message.toolName,
            arguments: message.args || {},
          })
          .then((result) => {
            backgroundPort.postMessage({
              type: 'tool-result',
              requestId: message.requestId,
              data: { success: true, payload: result },
            });
          })
          .catch((error) => {
            backgroundPort.postMessage({
              type: 'tool-result',
              requestId: message.requestId,
              data: { success: false, error: error.message },
            });
          });
      }

      if (message.type === 'request-tools-refresh') {
        sendToolUpdate(MESSAGE_TYPES.REFRESH_REQUEST);
      }
    });
  };

  async function setupToolChangeListener() {
    if (!client) {
      return Promise.resolve();
    }

    const capabilities = client.getServerCapabilities();

    logger(
      ['debug'],
      [
        '[MCP Proxy] Server supports tool list change notifications',
        capabilities,
      ]
    );

    client.setNotificationHandler(ToolListChangedNotificationSchema, () => {
      logger(['debug'], ['[MCP Proxy] Received tool list change notification']);

      return sendToolUpdate(MESSAGE_TYPES.UPDATE);
    });

    return Promise.resolve();
  }

  /**
   * Fetches current tools and sends an update message to the background port.
   * @param updateType - The event type identifier (e.g., "tools-updated")
   */
  async function sendToolUpdate(updateType: string) {
    if (!backgroundPort) {
      logger(['warn'], ['[MCP Proxy] No background port to send tool update']);
      return Promise.resolve();
    }

    return client
      .listTools()
      .then(({ tools }) => {
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
      })
      .catch((error) => {
        logger(['error'], ['[MCP Proxy] Failed to send tool update:', error]);
      });
  }

  transport.onclose = () => {
    if (!chrome.runtime?.id) {
      return;
    }

    backgroundPort.disconnect();
    connectionStarted = false;
  };

  backgroundPort.onDisconnect.addListener(() => {
    if (!chrome.runtime?.id) {
      return;
    }

    if (chrome.runtime.lastError) {
      logger(['error'], ['Port disconnected due to url change']);
    }

    transport
      .close()
      .then(() => {
        connectionStarted = false;
      })
      .catch((error) => {
        logger(['error'], [error]);
      });
  });

  setupTransportAndConnectClient();
  if (refreshTools) {
    return sendToolUpdate(MESSAGE_TYPES.REFRESH_REQUEST);
  }

  return Promise.resolve();
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === START_MCP_CONNECTION) {
    connectionStarted = false;
    mcpConnectionInitialiser().then(() => {
      try {
        sendResponse();
      } catch (error) {
        logger(['error'], ['Failed to send response:', error]);
      }
    });
  }

  if (message.type === MESSAGE_TYPES.REFRESH_REQUEST) {
    connectionStarted = false;
    mcpConnectionInitialiser(true).then(() => {
      try {
        sendResponse();
      } catch (error) {
        logger(['error'], ['Failed to send response:', error]);
      }
    });
  }

  // Not returning true to keep the message channel open.
  // As the response is taking too long and causing the extension to remain idle for a task(eg. workflow execution).
  // So we might see an error (Unchecked runtime.lastError: The page keeping the extension port is moved into back/forward cache, so the message channel is closed.) in the chrome://extensions page.
});
