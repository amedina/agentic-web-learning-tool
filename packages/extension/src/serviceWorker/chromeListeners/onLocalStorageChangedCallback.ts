/**
 * Internal dependencies
 */
import type McpHub from "../mcpHub";
import type { MCPConfig } from "../types";


const onLocalStorageChangedCallback = (mcpHub: McpHub) => {
    chrome.storage.local.get(
        'mcpServers',
        async ({ mcpServers }: MCPConfig) => {
            await Promise.all(
                Object.keys(mcpServers).map(async (serverName) => {
                    await mcpHub.addNewServer(
                        mcpServers[serverName],
                        serverName
                    );
                })
            );
        }
    );
};

export default onLocalStorageChangedCallback;
