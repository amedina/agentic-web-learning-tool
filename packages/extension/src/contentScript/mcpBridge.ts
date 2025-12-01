/**
 * External dependencies
 */
import { TabClientTransport } from "@mcp-b/transports";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
let connected = false;
try {
    (async () => {
        const transport = new TabClientTransport({
            targetOrigin: window.location.origin,
        });

        const client = new Client({
            name: "ExtensionProxyClient",
            version: "1.0.0",
        });

        // Connect to extension background
        const backgroundPort = chrome.runtime.connect({
            name: "mcp-content-script-proxy",
        });

        const interval = setInterval(async () => {
            try {
                if (!connected) {
                    await client.connect(transport);
                    connected = true;
                }
                const pageTools = await client.listTools();

                backgroundPort.postMessage({
                    type: "register-tools",
                    tools: pageTools.tools,
                });
                clearInterval(interval)
            } catch (error) {
                //empty code block
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