/**
 * External dependencies.
 */
import {
  EXTENSION_TOOL_PREFIX,
  DOM_TOOL_NAME_PREFIX,
} from '@google-awlt/common';

/**
 * Extracts the type of the tool from the tool name.
 *
 * @param {string} toolName - The name of the tool.
 * @returns {string} The type of the tool.
 */
const getToolType = (toolName: string) => {
  if (
    toolName.startsWith(EXTENSION_TOOL_PREFIX) ||
    toolName.startsWith(DOM_TOOL_NAME_PREFIX)
  ) {
    return 'mbp-b';
  }

  if (toolName.includes('_mcp_') && toolName.match(/^(.*?)_mcp_/)) {
    return 'mcp';
  }

  return 'unknown';
};

export default getToolType;
