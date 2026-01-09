/**
 * External dependencies
 */
import type { MCPConfig } from '@google-awlt/common';
/**
 * Internal dependencies
 */
import type McpHub from '../mcpHub';

const onLocalStorageChangedCallback = (mcpHub: McpHub) => {
  chrome.storage.local.get('mcpServers', async ({ mcpServers }: MCPConfig) => {
    await Promise.all(
      Object.keys(mcpServers ?? {}).map(async (serverName) => {
        console.log(mcpServers);
        if (!serverName) {
          return Promise.resolve();
        }

        if (!mcpServers[serverName].enabled) {
          mcpHub.disableMCPServerTools(serverName);
          return;
        }

        await mcpHub.addNewServer(mcpServers[serverName], serverName);
      })
    );
  });
};

export default onLocalStorageChangedCallback;
