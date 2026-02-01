/**
 * External dependencies
 */
import { getToolNameWithoutPrefix } from '@google-awlt/design-system';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import {
  EXTENSION_TOOL_PREFIX,
  DOM_TOOL_NAME_PREFIX,
} from '@google-awlt/common';
/**
 * Internal dependencies
 */
import { ToolNameMap } from '../../../../../contentScript/tools/builtInTools';
import { isUrl } from '../../../utils';

type SingleGroupTool = {
  group: string;
  key: string;
  items: { id: string; label: string }[];
};

type GroupedTool = {
  [key: string]: {
    group: string;
    key: string;
    isWebSiteTool: boolean;
    isExtensionTool: boolean;
    isMCPTool: boolean;
    items: McpTool[];
  };
};

const createToolDropdown = (
  tools: McpTool[],
  toolNameToMCPMap: Record<string, string>,
  tabIdToUrlMap: { [key: string]: chrome.tabs.Tab },
  currentTabId: number
) => {
  if (Object.keys(tabIdToUrlMap).length === 0) {
    return [];
  }

  const toolGroups: SingleGroupTool[] = [];
  const toolToTypeMap = tools.reduce((acc, tool) => {
    if (getToolNameWithoutPrefix(tool.name) === 'dummyTool') {
      return acc;
    }
    const result =
      tabIdToUrlMap[currentTabId].url && isUrl(tabIdToUrlMap[currentTabId].url)
        ? new URL(tabIdToUrlMap[currentTabId].url).hostname
        : 'others';
    if (
      tool.name.startsWith(EXTENSION_TOOL_PREFIX) ||
      tool.name.startsWith(DOM_TOOL_NAME_PREFIX)
    ) {
      const prefixToUse = tool.name.startsWith(EXTENSION_TOOL_PREFIX)
        ? EXTENSION_TOOL_PREFIX
        : '';
      const toolNameWithoutHardCodePrefix = tool.name.substring(
        prefixToUse.length
      );
      const result =
        ToolNameMap[toolNameWithoutHardCodePrefix as keyof typeof ToolNameMap];

      if (acc[result]) {
        acc[result].items.push(tool);
      } else {
        acc[result] = {
          group: result,
          key: result,
          isMCPTool: false,
          isWebSiteTool: false,
          isExtensionTool: true,
          items: [tool],
        };
      }
    } else if (tool.name.includes('_mcp')) {
      const match = tool.name.match(/^(.*?)_mcp_/);
      const mcpServerId = tool.name.substring(match?.[0].length ?? 0);
      const mcpServerName =
        mcpServerId && toolNameToMCPMap[mcpServerId]
          ? toolNameToMCPMap[mcpServerId]
          : 'others';

      if (acc[mcpServerName]) {
        acc[mcpServerName].items.push(tool);
      } else {
        acc[mcpServerName] = {
          group: mcpServerName,
          key: mcpServerName,
          isMCPTool: true,
          isWebSiteTool: false,
          isExtensionTool: false,
          items: [tool],
        };
      }
    } else {
      if (acc[result]) {
        acc[result].items.push(tool);
      } else {
        acc[result] = {
          group: result,
          key: result,
          isWebSiteTool: true,
          isMCPTool: false,
          isExtensionTool: false,
          items: [tool],
        };
      }
    }
    return acc;
  }, {} as GroupedTool);

  Object.keys(toolToTypeMap).forEach((key) => {
    if (toolToTypeMap[key].isWebSiteTool) {
      toolGroups.push({
        group: toolToTypeMap[key].group,
        key: toolToTypeMap[key].key,
        items: toolToTypeMap[key].items.map((tool) => ({
          id: tool.name,
          label: getToolNameWithoutPrefix(tool.name) ?? '',
        })),
      });
    }
  });

  Object.keys(toolToTypeMap).forEach((key) => {
    if (toolToTypeMap[key].isMCPTool) {
      toolGroups.push({
        group: toolToTypeMap[key].group,
        key: toolToTypeMap[key].key,
        items: toolToTypeMap[key].items.map((tool) => ({
          id: tool.name,
          label: getToolNameWithoutPrefix(tool.name) ?? '',
        })),
      });
    }
  });

  Object.keys(toolToTypeMap).forEach((key) => {
    if (toolToTypeMap[key].isExtensionTool) {
      toolGroups.push({
        group: toolToTypeMap[key].group,
        key: toolToTypeMap[key].key,
        items: toolToTypeMap[key].items.map((tool) => ({
          id: tool.name,
          label: getToolNameWithoutPrefix(tool.name) ?? '',
        })),
      });
    }
  });

  return toolGroups;
};

export default createToolDropdown;
