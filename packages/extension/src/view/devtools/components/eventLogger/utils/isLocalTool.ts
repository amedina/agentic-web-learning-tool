/**
 * Checks if a tool is local to the current tab.
 * @param toolName The name of the tool.
 * @param tabId The ID of the current tab.
 * @returns True if the tool is local to the current tab, false otherwise.
 */
export const isLocalTool = (toolName: string, tabId: number) => {
  if (!tabId) {
    return true;
  }

  if (toolName === 'dummyTool') {
    return false;
  }

  // Assuming all WebMCP tools follow the naming convention: wt_tab<ID>_<name>
  // TODO: Need to verify this assumption.
  if (toolName.includes('wt_tab')) {
    return toolName.includes(`wt_tab${tabId}_`);
  }

  return true;
};
