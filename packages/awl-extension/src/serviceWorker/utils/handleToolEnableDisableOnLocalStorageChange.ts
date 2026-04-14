/**
 * External dependencies
 */
import type { WebMCPTool } from '@google-awlt/design-system';
import { logger } from '@google-awlt/common';
/**
 * Internal dependencies
 */
import onLocalStorageChangedCallback from '../chromeListeners/onLocalStorageChangedCallback';
import type McpHub from '../mcpHub';

const handleToolEnableDisableOnLocalStorageChange = async (
  changes: {
    [key: string]: chrome.storage.StorageChange;
  },
  mcpHub: McpHub
) => {
  if (changes?.mcpServers) {
    const { newValue = {}, oldValue = {} } = changes?.mcpServers as unknown as {
      newValue: Record<string, any>;
      oldValue: Record<string, any>;
    };
    //If old value has more keys then deletion has happened else insertion has happened, if value is equal then updation has happened
    if (Object.keys(oldValue).length > Object.keys(newValue).length) {
      await Promise.all(
        Object.keys(oldValue).map((key) => {
          if (!newValue?.[key]) {
            mcpHub.removeMCPServer(key);
          }
        })
      );
      return;
    }

    onLocalStorageChangedCallback(mcpHub);
  }

  if (changes.builtInWebMCPToolsState) {
    const newValue =
      (changes.builtInWebMCPToolsState?.newValue as Record<string, boolean>) ??
      {};

    Object.keys(newValue).map((key) => {
      if (newValue?.[key]) {
        Array.from(mcpHub.registeredTools.entries()).forEach(
          ([toolName, registeredTool]) => {
            if (toolName.includes(key)) {
              registeredTool.enable();
            }
          }
        );
      } else {
        Array.from(mcpHub.registeredTools.entries()).forEach(
          ([toolName, registeredTool]) => {
            if (toolName.includes(key)) {
              registeredTool.disable();
            }
          }
        );
      }
    });
  }

  if (changes.userWebMCPTools) {
    const newValue = (changes.userWebMCPTools?.newValue as WebMCPTool[]) ?? [];

    newValue.map((tool) => {
      if (tool.enabled) {
        Array.from(mcpHub.registeredTools.entries()).forEach(
          ([toolName, registeredTool]) => {
            if (toolName.includes(tool.name)) {
              registeredTool.enable();
            }
          }
        );
      } else {
        Array.from(mcpHub.registeredTools.entries()).forEach(
          ([toolName, registeredTool]) => {
            if (toolName.includes(tool.name)) {
              registeredTool.disable();
            }
          }
        );
      }
    });
  }

  mcpHub.server.server?.transport
    ?.send({
      jsonrpc: '2.0',
      method: 'get/Tools',
    })
    .catch((error) => {
      logger(['error'], ['Error requesting tools after reconnecting:', error]);
    });
};

export default handleToolEnableDisableOnLocalStorageChange;
