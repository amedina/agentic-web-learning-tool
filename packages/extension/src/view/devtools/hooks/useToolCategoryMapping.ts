/**
 * External dependencies.
 */
import { useEffect, useCallback, useState } from 'react';
import {
  EXTENSION_TOOL_PREFIX,
  DOM_TOOL_NAME_PREFIX,
} from '@google-awlt/common';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Internal dependencies.
 */
import { builtInTools } from '../../../contentScript/tools';
import { TOOL_CATEGORIES } from '../constants';

interface WorkflowComposerData {
  graph: {};
  meta: {
    name: string;
    isWebMCP?: boolean;
  };
}
interface StorageData {
  userWebMCPTools: Tool[];
  'workflow-composer': Record<string, WorkflowComposerData>;
}

const getToolCategory = (
  toolName: string,
  userTools: string[],
  workflowTools: string[]
): string => {
  if (
    toolName.startsWith(EXTENSION_TOOL_PREFIX) ||
    toolName.startsWith(DOM_TOOL_NAME_PREFIX)
  ) {
    return TOOL_CATEGORIES.MCP_B;
  }

  if (toolName.includes('_mcp_') && toolName.match(/^(.*?)_mcp_/)) {
    return TOOL_CATEGORIES.MCP_SERVER;
  }

  if (builtInTools.find((tool) => tool.name === toolName)) {
    return TOOL_CATEGORIES.BUILT_IN;
  }

  if (userTools.includes(toolName)) {
    return TOOL_CATEGORIES.USER;
  }

  if (workflowTools.includes(toolName)) {
    return TOOL_CATEGORIES.WORKFLOW;
  }

  return TOOL_CATEGORIES.WEBSITE;
};

/**
 * Get tool category mapping for tools.
 *
 * User tools -- localStorage
 * Workflow tools -- localStorage
 * Built-in tools -- Constant variable
 * MCP tools -- suffix
 * mcp-b tools -- prefix
 * WebSite tools -- nothing
 *
 * @param tools
 * @returns mapping of tool name to tool category
 */
const useToolCategoryMapping = (tools: Tool[]) => {
  const [userTools, setUserTools] = useState<string[]>([]);
  const [workflowTools, setWorkflowTools] = useState<string[]>([]);

  const mapping = new Map<string, string>();

  const intitialSync = useCallback(async () => {
    const {
      userWebMCPTools,
      'workflow-composer': workflowWebMCPTools,
    }: StorageData = await chrome.storage.local.get([
      'userWebMCPTools',
      'workflow-composer',
    ]);

    if (userWebMCPTools && userWebMCPTools.length > 0) {
      setUserTools(userWebMCPTools.map((tool) => tool.name));
    }

    if (workflowWebMCPTools && Object.keys(workflowWebMCPTools).length > 0) {
      setWorkflowTools(
        Object.keys(workflowWebMCPTools)
          .map((key) =>
            workflowWebMCPTools[key].meta.isWebMCP
              ? workflowWebMCPTools[key].meta.name
              : ''
          )
          .filter((toolName) => toolName !== '')
      );
    }
  }, [setUserTools, setWorkflowTools, tools]);

  useEffect(() => {
    intitialSync();
  }, [intitialSync, tools]);

  useEffect(() => {
    tools.forEach((tool) => {
      mapping.set(
        tool.name,
        getToolCategory(tool.name, userTools, workflowTools)
      );
    });
  }, [tools]);

  return mapping;
};

export default useToolCategoryMapping;
