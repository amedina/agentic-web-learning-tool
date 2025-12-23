/**
 * External dependencies
 */
import { TabClientTransport } from "@mcp-b/transports";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

/**
 * Internal dependencies
 */
import { CONNECTION_NAMES } from "..//utils/constants";
let connectionStarted = false;

try {
    (async () => {
        // Prevent running in iframes
        if (window !== window.top) {
            return;
        }

        // 0. Inject Polyfill FIRST (Critical for modelContext)
        try {
            const polyfillScript = document.createElement('script');
            polyfillScript.src = chrome.runtime.getURL('contentScript/webmcp-polyfill.js');
            polyfillScript.onload = () => polyfillScript.remove();
            (document.head || document.documentElement).appendChild(polyfillScript);
            console.log("WebMCP: Injected webmcp-polyfill.js");
        } catch (e) {
            console.error("WebMCP: Failed to inject webmcp-polyfill.js", e);
        }

        // 1. Inject registerTools.js
        try {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('contentScript/registerTools.js');
            script.onload = () => script.remove();
            (document.head || document.documentElement).appendChild(script);
            console.log("WebMCP: Injected registerTools.js");
        } catch (e) {
            console.error("WebMCP: Failed to inject registerTools.js", e);
        }

        const storage = await chrome.storage.local.get();
        const userWebMCPTools = storage && storage['userWebMCPTools'];

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

        // Moved storage get to top level (already there in previous replacement, but ensuring order)

        //Need to set interval because the TabServerTransport might not be ready to accept connections yet
        const interval = setInterval(async () => {
            try {

                if (userWebMCPTools) {
                    // We need to send the tools to the Main World (registerTools.ts) because:
                    // 1. mcpBridge.ts is in Isolated World and cannot access window.navigator.modelContext
                    // 2. Main World can use import(blob) thanks to our CSP stripping
                    window.postMessage({
                        type: "REGISTER_USER_TOOLS",
                        tools: userWebMCPTools
                    }, "*");
                }


                if (!client.transport && !connectionStarted) {
                    try {
                        await client.connect(transport);
                        connectionStarted = true;
                    } catch (error) {
                        console.log("Error connecting client:", error);
                    }
                }
                if (client.transport) {
                    clearInterval(interval);

                    // client.listTools sends message to TabServerTransport which is implemented by the MCP-B polyfill in real world page context.
                    // @see https://github.com/WebMCP-org/npm-packages/blob/a262b42b7dc260f47f6fbc5b6dd82937ec01fb83/global/src/global.ts#L2167-L2170
                    const pageTools = await client.listTools();

                    //Send initial list of tools to service worker
                    backgroundPort.postMessage({
                        type: "register-tools",
                        tools: pageTools.tools,
                    });
                }
            } catch (error) {
                console.log("Error connecting to MCP background:", error);
            }
        }, 1000);

        // Listen for messages from service worker.
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
            if (!chrome.runtime?.id) {
                return;
            }

            backgroundPort.disconnect();
        }

        backgroundPort.onDisconnect.addListener(() => {
            if (!chrome.runtime?.id) {
                return;
            }

            transport.close();
        });
    })();

} catch (error) {
    console.log("Error connecting to MCP background:", error);
}
