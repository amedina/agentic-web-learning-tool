/**
 * External dependencies
 */
import { getToolNameWithoutPrefix } from '@google-awlt/design-system';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { isUrl } from '@google-awlt/common';
/**
 * Internal dependencies
 */
import { getMcpbToolGroup } from '../../../utils';
import { ToolNameMap } from '../../../constants';

type ToolDropdownItem = {
  id: string;
  label: string;
  hideLabel: boolean;
  group: string;
  items: SingleItemType[];
}[];

type SubMenuItem = {
  id: string;
  label: string;
  group?: string;
};

type SingleItemType = {
  id: string;
  label: string;
  mainLabel: string;
  submenu: SubMenuItem[];
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

  const toolGroups: ToolDropdownItem = [];
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
      if (acc['mcp-b']) {
        acc['mcp-b'].items.push(tool);
      } else {
        acc['mcp-b'] = {
          group: 'MCP-B',
          key: 'mcp-b',
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
        id: toolToTypeMap[key].group,
        label: toolToTypeMap[key].group,
        group: toolToTypeMap[key].group,
        hideLabel: true,
        items: [
          {
            id: toolToTypeMap[key].group,
            label: toolToTypeMap[key].group,
            mainLabel: 'Tools',
            submenu: toolToTypeMap[key].items.map((tool) => ({
              id: tool.name,
              label: getToolNameWithoutPrefix(tool.name) ?? '',
            })),
          },
        ],
      });
    }
  });

  Object.keys(toolToTypeMap).forEach((key) => {
    if (toolToTypeMap[key].isMCPTool) {
      toolGroups.push({
        id: toolToTypeMap[key].group,
        label: toolToTypeMap[key].group,
        group: toolToTypeMap[key].group,
        hideLabel: true,
        items: [
          {
            id: toolToTypeMap[key].group,
            label: toolToTypeMap[key].group,
            mainLabel: 'Tools',
            submenu: toolToTypeMap[key].items.map((tool) => ({
              id: tool.name,
              label: getToolNameWithoutPrefix(tool.name) ?? '',
            })),
          },
        ],
      });
    }
  });

  const mcpBTools = Object.entries(ToolNameMap).reduce(
    (acc, [, currentValue]) => {
      const filteredTools = toolToTypeMap['mcp-b']?.items
        .filter(
          (tool) =>
            ToolNameMap[
              getToolNameWithoutPrefix(tool.name) as keyof typeof ToolNameMap
            ] === currentValue
        )
        .map((tool) => ({
          id: tool.name,
          label: getToolNameWithoutPrefix(tool.name) ?? '',
          hideLabel: false,
        }));

      if (acc[currentValue]) {
        return acc;
      } else {
        acc[currentValue] = {
          id: currentValue,
          label: currentValue,
          mainLabel: 'Tools',
          submenu: filteredTools,
        };
      }
      return acc;
    },
    {} as { [key: string]: SingleItemType }
  );

  Object.keys(toolToTypeMap).forEach((key) => {
    if (toolToTypeMap[key].isExtensionTool) {
      toolGroups.push({
        id: toolToTypeMap[key].group,
        label: toolToTypeMap[key].group,
        group: toolToTypeMap[key].group,
        hideLabel: true,
        items: [
          {
            id: toolToTypeMap[key].group,
            label: toolToTypeMap[key].group,
            mainLabel: 'Tools Types',
            submenu: Object.values(mcpBTools).filter(
              (tool) => tool.submenu.length > 0
            ),
          },
        ],
      });
    }
  });

  return toolGroups;
};

export default createToolDropdown;
