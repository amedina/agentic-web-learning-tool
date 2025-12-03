/**
 * External dependencies
 */
import { TabClientTransport } from "@mcp-b/transports";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
/**
 * Internal dependencies
 */
import { CONNECTION_NAMES } from "..//utils/constants";
let connected = false;
try {
    (async () => {
        //This connects to the page context since content scripts have a separate JS context
        //TabClientTransport uses window.postMessage under the hood. The TabServerTransport is implemented from the MCP-B polyfill
        const transport = new TabClientTransport({
            targetOrigin: window.location.origin,
        });

        const client = new Client({
            name: "ExtensionProxyClient",
            version: "1.0.0",
        });

        const backgroundPort = chrome.runtime.connect({
            name: CONNECTION_NAMES.CONTENT_SCRIPT,
        });

        //Need to set interval because the TabServerTransport might not be ready to accept connections yet
        const interval = setInterval(async () => {
            try {
                if (!connected) {
                    await client.connect(transport);
                    connected = true;
                }
                const pageTools = await client.listTools();
                //Send initial list of tools to service worker
                backgroundPort.postMessage({
                    type: "register-tools",
                    tools: pageTools.tools,
                });
                clearInterval(interval)
            } catch (error) {
                console.error("Error connecting to MCP background:", error);
            }
        }, 100);

        backgroundPort.onMessage.addListener(async (message) => {
            if (message.type === "execute-tool") {
                const result = await client.callTool({
                    name: message.toolName,
                    arguments: message.args || {},
                });

                backgroundPort.postMessage({
                    type: "tool-result",
                    requestId: message.requestId,
                    data: { success: true, payload: result },
                });
            }
        });

        transport.onclose = () => {
            backgroundPort.disconnect();
        }

        backgroundPort.onDisconnect.addListener(() => {
            transport.close();
        });
    })();

} catch (error) {
    console.error("Error connecting to MCP background:", error);
}
