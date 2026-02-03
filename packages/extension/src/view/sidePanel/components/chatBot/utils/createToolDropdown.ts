/**
 * External dependencies
 */
import { getToolNameWithoutPrefix } from '@google-awlt/design-system';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Internal dependencies
 */
import { isUrl } from '../../../../../utils';
import { getMcpbToolGroup } from '../../../../../utils';

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
    const mcpbGroup = getMcpbToolGroup(tool.name);
    if (mcpbGroup) {
      if (acc[mcpbGroup]) {
        acc[mcpbGroup].items.push(tool);
      } else {
        acc[mcpbGroup] = {
          group: mcpbGroup,
          key: mcpbGroup,
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
