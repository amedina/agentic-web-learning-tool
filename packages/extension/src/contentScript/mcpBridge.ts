import { TabClientTransport } from "@mcp-b/transports";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

(async () => {
    // Connect to the page's MCP server
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

    // Discover and connect to page server
    await client.connect(transport);
    const pageTools = await client.listTools();

    // Register tools with background hub
    backgroundPort.postMessage({
        type: "register-tools",
        tools: pageTools.tools,
    });

    // Handle tool execution requests from background
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
})();
