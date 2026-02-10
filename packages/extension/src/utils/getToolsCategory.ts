/**
 * External dependencies.
 */
import {
  EXTENSION_TOOL_PREFIX,
  DOM_TOOL_NAME_PREFIX,
} from '@google-awlt/common';
import { PREDEFINED_WORKFLOWS } from '@google-awlt/workflow-ui';

/**
 * Internal dependencies.
 */
import { builtInTools } from '../contentScript/tools';
import { TOOL_CATEGORIES } from '../view/devtools/constants';
import { sanitizeToolName } from '../serviceWorker/utils';

/**
 * Get tool category for a tool.
 *
 * @param toolName - Name of the tool.
 * @param userTools - Array of user tools.
 * @param workflowTools - Array of workflow tools.
 * @returns Category of the tool.
 */
export const getToolCategory = (
  toolName: string,
  userTools: string[] | null,
  workflowTools: string[] | null
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

  if (userTools && userTools.includes(toolName)) {
    return TOOL_CATEGORIES.USER;
  }

  if (workflowTools && workflowTools.includes(toolName)) {
    return TOOL_CATEGORIES.WORKFLOW;
  }

  if (
    PREDEFINED_WORKFLOWS.find(
      (workflow) => sanitizeToolName(workflow.meta.name) === toolName
    )
  ) {
    return TOOL_CATEGORIES.BUILT_IN_WORKFLOW;
  }

  return TOOL_CATEGORIES.WEBSITE;
};
