/**
 * External dependencies
 */
import {
  EXTENSION_TOOL_PREFIX,
  DOM_TOOL_NAME_PREFIX,
} from '@google-awlt/common';

/**
 * Internal dependencies
 */
import { ToolNameMap } from '../contentScript/tools/mcpbTools';

export const getMcpbToolGroup = (toolName: string): string | null => {
  if (
    toolName.startsWith(EXTENSION_TOOL_PREFIX) ||
    toolName.startsWith(DOM_TOOL_NAME_PREFIX)
  ) {
    const prefixToUse = toolName.startsWith(EXTENSION_TOOL_PREFIX)
      ? EXTENSION_TOOL_PREFIX
      : '';
    const toolNameWithoutHardCodePrefix = toolName.substring(
      prefixToUse.length
    );
    return (
      ToolNameMap[toolNameWithoutHardCodePrefix as keyof typeof ToolNameMap] ??
      null
    );
  }
  return null;
};
