/**
 * External dependencies
 */
import { getToolNameWithoutPrefix } from '@google-awlt/design-system';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
/**
 * Internal dependencies
 */
import { ToolNameMap } from '../../../../../contentScript/tools/builtInTools';

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
  toolNameToMCPMap: Record<string, string>
) => {
  const toolGroups: SingleGroupTool[] = [];

  const toolToTypeMap = tools.reduce((acc, tool) => {
    const WEBSITE_TOOL_PREFIX = 'website_tool_';
    const EXTENSION_TOOL_PREFIX = 'extension_tool_';
    const DOM_TOOL_NAME_PREFIX = 'dom_extract_';

    if (getToolNameWithoutPrefix(tool.name) === 'dummyTool') {
      return acc;
    }

    if (tool.name.startsWith(WEBSITE_TOOL_PREFIX)) {
      const toolNameWithoutHardCodePrefix = tool.name.substring(
        WEBSITE_TOOL_PREFIX.length
      );
      const pieces = toolNameWithoutHardCodePrefix.split('_');
      const cleanToolName = pieces.join('_');
      const result = cleanToolName.split('_tab')[0].replaceAll('_', '.');

      if (acc[result]) {
        acc[result].items.push(tool);
      } else {
        acc[result] = {
          group: result,
          key: result,
          isMCPTool: false,
          isWebSiteTool: true,
          isExtensionTool: false,
          items: [tool],
        };
      }
      return acc;
    } else if (
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
      if (acc['others']) {
        acc['others'].items.push(tool);
      } else {
        acc['others'] = {
          group: 'others',
          key: 'others',
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
